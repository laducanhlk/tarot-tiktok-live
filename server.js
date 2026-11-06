const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector/legacy");
const { SignConfig, RouteConfig } = require("tiktok-live-connector");
const TAROT_DATA = require("./public/tarot_data");

// Ngăn tiktok-live-connector tự động gọi EulerStream đòi gói Business để ký URL lấy danh sách quà
if (RouteConfig) {
  RouteConfig.fetchRoomGifts = async () => [];
}

// Bắt mọi ngoại lệ chưa xử lý để đảm bảo server livestream luôn hoạt động bền bỉ, không bị văng
process.on("uncaughtException", (err) => {
  console.error("⚠️ [Phòng Vệ Server] Bắt lỗi ngoại lệ không đồng bộ:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ [Phòng Vệ Server] Bắt Promise rejection:", reason?.message || reason);
});

const PORT = process.env.PORT || 3000;
const CLEANSE_LIKE_THRESHOLD = 50;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==================== QUẢN LÝ TRẠNG THÁI (STATE) ====================
let tiktokConnection = null;
let currentUniqueId = null;
let isConnectedToTikTok = false;

let totalLikes = 0;
let likeBuffer = 0;
let cleanseCount = 0;

// Thanh tiến trình "Năng Lượng Tập Thể" (Global Energy Bar: 5.000 Tim hoặc 50 Lượt Chia Sẻ)
const GLOBAL_ENERGY_LIKE_TARGET = 5000;
const GLOBAL_ENERGY_SHARE_TARGET = 50;
let globalEnergyLikes = 0;
let globalEnergyShares = 0;
let totalShares = 0;
let globalUnlockCount = 0;

function getGlobalEnergyState(pulseType = "none") {
  const likeRatio = globalEnergyLikes / GLOBAL_ENERGY_LIKE_TARGET;
  const shareRatio = globalEnergyShares / GLOBAL_ENERGY_SHARE_TARGET;
  // Đạt 5.000 tim HOẶC 50 lượt chia sẻ (hoặc tổng đóng góp tim + share đạt 100%, với 1 share = 100 tim năng lượng)
  const combinedRatio = Math.max(likeRatio, shareRatio, likeRatio + shareRatio);
  const percent = Math.min(100, Math.round(combinedRatio * 100));

  return {
    likes: globalEnergyLikes,
    likeTarget: GLOBAL_ENERGY_LIKE_TARGET,
    shares: globalEnergyShares,
    shareTarget: GLOBAL_ENERGY_SHARE_TARGET,
    totalLikes,
    totalShares,
    percent,
    unlockCount: globalUnlockCount,
    pulseType
  };
}

// Hàng chờ câu hỏi của người xem (VIP / Ưu tiên đứng trước)
let questionQueue = [];
let currentSessionReading = null;
let currentTopic = "Tổng Quan Tuần Mới"; // Chủ đề phiên live: "Tình Duyên" | "Sự Nghiệp" | "Tổng Quan Tuần Mới"

// Cấu hình chuyên biệt cho TikTok Live Studio
let studioConfig = {
  autoDrawQueue: false,       // Tự động gọi câu hỏi trong hàng chờ và bốc bài
  autoDrawIntervalSec: 18,    // Chu kỳ tự động bốc bài (giây)
  voiceTTS: true,             // Giọng đọc AI đọc tên người xem & lời giải bài
  voiceSpeed: 1.5,            // Tốc độ giọng đọc (mặc định nhanh x1.5 lần, giữ nguyên tông giọng nữ ấm)
  bgmEnabled: true,           // Bật nhạc nền Tarot du dương
  bgmTrack: 1,                // 1: Đêm Trăng Thạch Anh | 2: Suối Nguồn Chữa Lành | 3: Vườn Địa Đàng Huyền Bí
  bgmVolume: 0.35,            // Âm lượng nhạc nền (0.0 -> 1.0)
  bgMode: "witch",            // "witch" (Cô phù thủy) | "chroma" (Phông xanh lá) | "transparent" (Trong suốt)
  customBgUrl: "/witch_bg.png"
};
// ==================== QUẢN LÝ ĐỌC BÀI TUẦN TỰ (KHÔNG CHỒNG TIẾNG) ====================
let currentReadingState = "idle"; // "idle" | "reading" | "pausing"
let currentActiveReadingId = null;
let readingSafetyTimer = null;
let readingNextDelayTimer = null;
let autoDrawTimer = null;

/**
 * Lấy từng câu hỏi/người xem trong hàng chờ ra để bốc và đọc bài
 * force = true: streamer bấm nút ép gọi người tiếp theo
 */
function processNextQueueItem(force = false) {
  // Nếu đang đọc hoặc đang trong thời gian nghỉ ngơi giữa 2 lượt, tuyệt đối không bốc thêm bài mới
  if (currentReadingState !== "idle" && !force) {
    return false;
  }

  if (readingNextDelayTimer) {
    clearTimeout(readingNextDelayTimer);
    readingNextDelayTimer = null;
  }
  if (readingSafetyTimer) {
    clearTimeout(readingSafetyTimer);
    readingSafetyTimer = null;
  }

  if (questionQueue.length === 0) {
    currentReadingState = "idle";
    currentActiveReadingId = null;
    return false;
  }

  const nextItem = questionQueue.shift();
  currentReadingState = "reading";
  io.emit("queue:updated", questionQueue);

  let readingResult = null;
  if (nextItem.isLoveMatch && nextItem.loveMatchData) {
    readingResult = triggerLoveMatchReading({
      user: {
        uniqueId: nextItem.uniqueId,
        nickname: nextItem.nickname,
        profilePictureUrl: nextItem.profilePictureUrl
      },
      personA: nextItem.loveMatchData.personA,
      personB: nextItem.loveMatchData.personB
    });
  } else {
    const cardCount = Number(nextItem.cardCount) || (nextItem.isPriority ? 3 : 1);
    readingResult = triggerTarotDraw({
      cardCount,
      user: {
        uniqueId: nextItem.uniqueId,
        nickname: nextItem.nickname,
        profilePictureUrl: nextItem.profilePictureUrl,
        seekerName: nextItem.seekerName,
        seekerDob: nextItem.seekerDob,
        displayLabel: nextItem.displayLabel
      },
      question: nextItem.question,
      reason: nextItem.isPriority ? "queue_vip" : "queue_normal"
    });
  }

  const activeId = readingResult?.readingId || `read_${Date.now()}`;
  currentActiveReadingId = activeId;

  console.log(`🎙️ [Bắt Đầu Đọc] Khách: ${nextItem.nickname} | Mã: ${activeId} | Còn lại trong hàng chờ: ${questionQueue.length}`);

  // Safety timer dự phòng: nếu sau 45s Overlay gặp trục trặc không phản hồi thì tự kết thúc và bốc lượt kế tiếp
  readingSafetyTimer = setTimeout(() => {
    if (currentActiveReadingId === activeId && currentReadingState === "reading") {
      console.warn(`⏱️ [Safety Timer] Lượt đọc ${activeId} quá 45s, tự động chuyển người tiếp theo.`);
      handleReadingFinished(activeId);
    }
  }, 45000);

  return readingResult;
}

/**
 * Xử lý khi giọng đọc trên Overlay kết thúc đọc xong toàn bộ lời giải bài
 */
function handleReadingFinished(readingId) {
  // Chỉ nhận thông báo kết thúc từ chính lượt đọc đang diễn ra (tránh xung đột từ nhiều tab Overlay mở cùng lúc)
  if (readingId && currentActiveReadingId && readingId !== currentActiveReadingId) {
    console.log(`⚠️ [Bỏ qua tín hiệu cũ] Nhận readingId ${readingId} nhưng lượt hiện tại là ${currentActiveReadingId}`);
    return;
  }
  if (currentReadingState !== "reading") {
    return;
  }

  if (readingSafetyTimer) {
    clearTimeout(readingSafetyTimer);
    readingSafetyTimer = null;
  }

  console.log(`🧘 [Kết Thúc Lời Đọc] Lượt ${currentActiveReadingId}. Nghỉ 3.5s để người xem ngẫm bài trước khi bốc người kế tiếp.`);

  // Chuyển sang trạng thái nghỉ ngơi "pausing" - KHÔNG cho phép câu hỏi mới chen ngang trong thời gian nghỉ
  currentReadingState = "pausing";

  // Nghỉ 3.5s để người xem kịp ngẫm bài, sau đó mới sang "idle" và tự bốc người tiếp theo trong hàng chờ
  if (readingNextDelayTimer) clearTimeout(readingNextDelayTimer);
  readingNextDelayTimer = setTimeout(() => {
    currentReadingState = "idle";
    currentActiveReadingId = null;
    processNextQueueItem();
  }, 3500);
}

function restartAutoDrawTimer() {
  if (autoDrawTimer) {
    clearInterval(autoDrawTimer);
    autoDrawTimer = null;
  }
  // Nếu bật Auto-Queue và hiện tại đang rảnh thì gọi luôn người kế tiếp
  if (studioConfig.autoDrawQueue && currentReadingState === "idle") {
    processNextQueueItem();
  }
}

// Điều hướng tiện lợi cho Admin và Overlay
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay.html"));
});

app.get("/overlay", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "overlay.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ==================== HÀM BỖ TRỢ NGHIỆP VỤ TAROT ====================

/**
 * Tự động nhận diện chủ đề từ câu hỏi của người xem:
 * - "love": Tình duyên / Tình cảm
 * - "career": Công việc / Sự nghiệp / Tài chính
 * - "advice": Lời khuyên / Thông điệp chung
 */
function detectQuestionAspect(question = "", fallbackTopic = "") {
  const q = String(question || "").toLowerCase();
  const t = String(fallbackTopic || "").toLowerCase();

  const loveRegex =
    /(tình|yêu|người cũ|người ấy|crush|ex|hôn nhân|cưới|chia tay|quay lại|nhắn tin|hẹn hò|vợ|chồng|bạn trai|bạn gái|tỏ tình|thương|nhớ|duyên|ny|nyc|mối quan hệ)/i;
  const careerRegex =
    /(công việc|việc làm|sự nghiệp|tiền|tài chính|tài lộc|lương|kinh doanh|buôn bán|đầu tư|chuyển việc|xin việc|công ty|dự án|học|thi|thăng tiến|nợ|giàu|lộc|sếp|đồng nghiệp)/i;
  const adviceRegex =
    /(lời khuyên|thông điệp|vũ trụ|nên làm gì|hướng dẫn|tương lai|tuần mới|tháng mới)/i;

  if (loveRegex.test(q)) return "love";
  if (careerRegex.test(q)) return "career";
  if (adviceRegex.test(q)) return "advice";

  if (t.includes("tình duyên")) return "love";
  if (t.includes("sự nghiệp")) return "career";
  return "advice";
}

/**
 * Tạo 2 câu luận giải chuẩn xác cho từng lá bài:
 * - Câu 1 (cardExplanation): 1 câu giải thích ý nghĩa cốt lõi của lá bài rút được (kèm chiều Xuôi/Ngược).
 * - Câu 2 (questionConclusion): 1 câu kết luận trả lời trực diện, sát nhất với câu hỏi của người xem.
 */
function buildQuestionSpecificInterpretation(card, question = "", aspect = "advice") {
  const cleanQ = String(question || "")
    .replace(/^(?:hỏi|hoi|bói|boi|tarot|ask)\s*[:\-]\s*/i, "")
    .trim();
  const qLower = cleanQ.toLowerCase();

  const challengingCardIds = new Set([12, 13, 15, 16, 18, 29, 40, 52, 54, 57, 58, 59, 68]);
  const isPositive = !card.isReversed && !challengingCardIds.has(Number(card.id));
  const orientText = card.isReversed ? "chiều Ngược" : "chiều Xuôi";
  const kwText = (card.keywords || []).slice(0, 3).join(", ").toLowerCase();
  const coreAspectText =
    aspect === "love" ? card.love : aspect === "career" ? card.career : card.advice;

  // Câu 1: 1 câu giải thích về lá bài
  const cardExplanation = `Lá bài ${card.name} (${orientText}) đại diện cho nguồn năng lượng của ${kwText} — ${coreAspectText}`;

  // Câu 2: 1 câu kết luận trực diện cho câu hỏi của người xem
  let questionConclusion = "";

  if (/(người cũ|ny cũ|nyc|ex|quay lại|hàn gắn|tái hợp)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Giữa hai người vẫn còn sợi dây duyên nợ rất sâu, người ấy đang nhớ về bạn và khả năng cao sẽ sớm mở lời quay lại.`
      : `Chốt lại cho câu hỏi của bạn: Cả hai vẫn còn rào cản và tổn thương chưa chữa lành nên rất khó quay lại lúc này, bạn hãy ưu tiên sự bình yên của bản thân trước.`;
  } else if (/(nhắn tin|liên lạc|gọi điện|chủ động|mở lời|im lặng)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Sắp tới đối phương sẽ phá vỡ sự im lặng và chủ động nhắn tin, liên lạc với bạn cùng tín hiệu rất tích cực.`
      : `Chốt lại cho câu hỏi của bạn: Hiện tại đối phương vẫn đang ngần ngại và giữ cái tôi cao nên chưa chủ động nhắn tin ngay, bạn đừng quá sốt ruột chờ đợi.`;
  } else if (/(crush|thích em|thích mình|yêu em|yêu mình|thật lòng|tình cảm của|nghĩ gì|đối phương|người ấy có)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Người ấy thực sự dành tình cảm chân thành và hình bóng của bạn đang chiếm vị trí rất đặc biệt trong lòng họ.`
      : `Chốt lại cho câu hỏi của bạn: Cảm xúc phía đối phương hiện còn phân vân và chưa đủ rõ ràng, bạn hãy quan sát hành động thực tế thay vì trao hết tâm tư quá sớm.`;
  } else if (/(chọn ai|hai người|2 người|tiếp tục hay|buông bỏ|dừng lại|nên bước tiếp)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Bạn hãy chọn người và hướng đi mang lại cảm giác bình yên, trân trọng giá trị của bạn và sẵn sàng đồng hành lâu dài.`
      : `Chốt lại cho câu hỏi của bạn: Đã đến lúc bạn nên dứt khoát buông bỏ mối quan hệ gây mệt mỏi để mở lòng đón nhận nhân duyên xứng đáng hơn.`;
  } else if (/(bao giờ có|khi nào có|thoát ế|duyên mới|người yêu mới|kết hôn|cưới|lấy chồng|lấy vợ)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Nhân duyên tốt lành đang tiến đến rất gần, bạn sẽ sớm gặp được người tâm đầu ý hợp trong những cuộc hội ngộ sắp tới.`
      : `Chốt lại cho câu hỏi của bạn: Duyên lành của bạn sẽ đến muộn hơn một chút, hiện tại bạn hãy cứ tỏa sáng và tận hưởng cuộc sống độc thân vui vẻ trước nhé.`;
  } else if (/(chuyển việc|nhảy việc|xin việc|phỏng vấn|công ty mới|đổi việc|ứng tuyển)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Việc chuyển việc và ứng tuyển sang môi trường mới hoàn toàn thuận lợi, mở ra bước tiến lớn cho sự nghiệp của bạn.`
      : `Chốt lại cho câu hỏi của bạn: Thời điểm này chưa thực sự chín muồi để vội vàng nhảy việc, bạn nên củng cố thêm kỹ năng và chờ cơ hội chắc chắn hơn.`;
  } else if (/(kinh doanh|buôn bán|đầu tư|tiền|tài chính|lộc|doanh thu|khởi sắc|lợi nhuận|tài lộc|mở shop|mở tiệm)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Vận trình tài chính và kinh doanh của bạn sắp khởi sắc mạnh mẽ, có lộc bất ngờ và thu về thành quả rất xứng đáng.`
      : `Chốt lại cho câu hỏi của bạn: Về tiền bạc và kinh doanh giai đoạn tới cần quản lý thận trọng, ưu tiên sự an toàn và tránh đầu tư mạo hiểm.`;
  } else if (/(thi|đỗ|đậu|học|điểm|tốt nghiệp|kỳ thi)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Với sự nỗ lực hiện tại, bạn hoàn toàn có khả năng đạt điểm số cao và vượt qua kỳ thi đúng như nguyện vọng.`
      : `Chốt lại cho câu hỏi của bạn: Bạn cần tập trung ôn luyện quyết liệt hơn ngay từ bây giờ và tránh chủ quan để đạt được kết quả an toàn nhất.`;
  } else if (/(có .* không|được không|ổn không|thuận lợi không|thành công không|tốt không|nên .* không)/i.test(qLower)) {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Lá bài khẳng định câu trả lời là CÓ — mọi việc đang ủng hộ bạn và sẽ diễn ra suôn sẻ như mong đợi.`
      : `Chốt lại cho câu hỏi của bạn: Lá bài khuyên bạn CẦN THẬN TRỌNG & KIÊN NHẪN — vẫn còn thử thách ngầm nên đừng vội vàng quyết định lúc này.`;
  } else {
    questionConclusion = isPositive
      ? `Chốt lại cho câu hỏi của bạn: Vận trình sắp tới rất sáng sủa và thuận lợi, bạn hãy tự tin hành động vì vũ trụ đang hậu thuẫn cho bạn.`
      : `Chốt lại cho câu hỏi của bạn: Bạn hãy giữ tâm thế bình tĩnh, tháo gỡ từng việc một và lắng nghe trực giác trước khi bước tiếp.`;
  }

  return {
    cardExplanation,
    questionConclusion,
    combinedText: `🔮 Giải nghĩa lá bài: ${cardExplanation}\n🎯 Kết luận cho bạn: ${questionConclusion}`
  };
}

/**
 * Ánh xạ ID lá bài (0..77) sang mã ảnh Rider-Waite-Smith 1909 chuẩn (metabismuth/tarot-json):
 * - Major Arcana (0..21): m00 .. m21
 * - Wands (22..35): w01 .. w14
 * - Cups (36..49): c01 .. c14
 * - Swords (50..63): s01 .. s14
 * - Pentacles (64..77): p01 .. p14
 */
function getRwsImageCode(cardId = 0) {
  const id = Number(cardId) || 0;
  if (id >= 0 && id <= 21) {
    return `m${String(id).padStart(2, "0")}`;
  }
  const suitPrefixes = ["w", "c", "s", "p"];
  const minorIdx = id - 22;
  const suitIdx = Math.floor(minorIdx / 14);
  const rankNum = (minorIdx % 14) + 1;
  const prefix = suitPrefixes[suitIdx] || "m";
  return `${prefix}${String(rankNum).padStart(2, "0")}`;
}

/**
 * Rút ngẫu nhiên N lá bài không trùng lặp từ bộ 78 lá chuẩn RWS,
 * kèm trạng thái Xuôi (Upright) hoặc Ngược (Reversed) và gán đúng 1 chủ đề riêng biệt cho từng lá:
 * - Nếu bốc 1 lá: Chỉ gán đúng chủ đề câu hỏi (love | career | advice)
 * - Nếu trải 3 lá: Lá 1 = Tình Yêu, Lá 2 = Công Việc, Lá 3 = Lời Khuyên
 */
function drawRandomCards(count = 1, singleAspect = "advice", question = "") {
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), TAROT_DATA.length);
  const deckCopy = [...TAROT_DATA];

  // Thuật toán xáo bài Fisher-Yates
  for (let i = deckCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deckCopy[i], deckCopy[j]] = [deckCopy[j], deckCopy[i]];
  }

  const aspectMeta = {
    love: {
      ribbon: "💖 Chủ Đề: Tình Yêu",
      title: "💖 Giải Mã Tình Duyên"
    },
    career: {
      ribbon: "⚜️ Chủ Đề: Công Việc & Tài Lộc",
      title: "⚜️ Giải Mã Công Việc & Sự Nghiệp"
    },
    advice: {
      ribbon: "🔮 Chủ Đề: Lời Khuyên Vũ Trụ",
      title: "🔮 Thông Điệp & Lời Khuyên Vũ Trụ"
    }
  };

  const threeCardAspects = ["love", "career", "advice"];
  const spreadLabels3Cards = [
    "💖 Lá 1: Tình Yêu",
    "⚜️ Lá 2: Công Việc / Sự Nghiệp",
    "🔮 Lá 3: Lời Khuyên / Tương Lai"
  ];

  return deckCopy.slice(0, safeCount).map((card, index) => {
    const assignedAspect =
      safeCount === 3
        ? threeCardAspects[index] || "advice"
        : aspectMeta[singleAspect]
        ? singleAspect
        : "advice";

    const meta = aspectMeta[assignedAspect];
    const isReversed = Math.random() < 0.25;
    const cardWithOrient = { ...card, isReversed };
    const interp = buildQuestionSpecificInterpretation(cardWithOrient, question, assignedAspect);
    const rwsCode = getRwsImageCode(card.id);

    return {
      ...cardWithOrient,
      rwsCode,
      imageUrl: `/api/card-img/${rwsCode}`,
      positionIndex: index + 1,
      positionLabel: safeCount === 3 ? spreadLabels3Cards[index] : meta.ribbon,
      assignedAspect,
      assignedTitle: safeCount === 3 ? spreadLabels3Cards[index] : meta.title,
      assignedText: card[assignedAspect] || card.advice,
      cardExplanation: interp.cardExplanation,
      questionConclusion: interp.questionConclusion,
      drawnAt: new Date().toISOString()
    };
  });
}

/**
 * Kiểm tra cú pháp Bói Ghép Đôi / Đo Độ Hợp Nhau (Love Compatibility Radar)
 * Cú pháp chuẩn: #tinhyeu "Tên - Ngày tháng năm sinh" "Tên - Ngày tháng năm sinh"
 * Hỗ trợ linh hoạt:
 * - #tinhyeu "Minh - 15/08/2000" "Lan - 01/02/2002"
 * - #tinhyeu "Tuấn - 20/05/1998" "Hoa - 14/02/2001) (hoặc ngoặc đơn, ngoặc vuông)
 * - #tinhyeu Minh - 15/08/2000 và Lan - 01/02/2002
 * - #tinhyeu Minh - 15/08/2000 - Lan - 01/02/2002
 * - #tinhyeu "Nam 2002" "Nữ 2004"
 */
function parseLoveMatchFromComment(commentText = "", defaultUser = "Bạn") {
  const raw = String(commentText).trim();
  if (!raw) return null;

  // 1. Kiểm tra tiền tố #tinhyeu, #tìnhyêu, #ghepdoi, #ghépđôi, tinhyeu, ghepdoi
  const prefixMatch = raw.match(/^(?:#tinhyeu|#tìnhyêu|#ghepdoi|#ghépđôi|tinhyeu|ghepdoi)\s*(.+)$/i);
  if (!prefixMatch) {
    // Hoặc gõ trực tiếp 2 cặp ngoặc kép chứa "Tên - Ngày sinh"
    const directQuoted = raw.match(/^["“'\[\(]([^"”'\]\)]+)["”'\]\)]\s*[\s,vàvớiva\-+&]*\s*["“'\[\(]([^"”'\]\)]+)["”'\]\)]?$/i);
    if (directQuoted) {
      return { personA: directQuoted[1].trim(), personB: directQuoted[2].trim(), rawQuery: raw };
    }
    // Cú pháp cũ "Nam 1999 Nu 2002"
    const directGenderYear = raw.match(/^(nam\s*\d{2,4}|\bnữ\s*\d{2,4}|\bnu\s*\d{2,4})\s*[-,&+vàoớiva]*\s*(nữ\s*\d{2,4}|nu\s*\d{2,4}|nam\s*\d{2,4})$/i);
    if (directGenderYear) {
      return {
        personA: directGenderYear[1].replace(/nam/i, "Nam ").replace(/nu|nữ/i, "Nữ ").replace(/\s+/g, " ").trim(),
        personB: directGenderYear[2].replace(/nu|nữ/i, "Nữ ").replace(/nam/i, "Nam ").replace(/\s+/g, " ").trim(),
        rawQuery: raw
      };
    }
    return null;
  }

  const body = prefixMatch[1].trim();

  // TH1: Dấu ngoặc kép / ngoặc đơn / ngoặc vuông / ngoặc thông minh: "Tên 1 - NS" "Tên 2 - NS"
  const quoteRegex = /["“'\[\(]([^"”'\]\)]+)["”'\]\)]\s*(?:và|va|với|voi|&|\+|,|-)?\s*["“'\[\(]([^"”'\]\)]+)["”'\]\)]?/i;
  const qm = body.match(quoteRegex);
  if (qm) {
    return {
      personA: qm[1].trim(),
      personB: qm[2].trim(),
      rawQuery: body
    };
  }

  // TH2: Phân tách bằng chữ 'và', 'với', '&', '+'
  // Ví dụ: #tinhyeu Minh - 15/08/2000 và Lan - 01/02/2002
  const splitWords = body.split(/\s+(?:và|va|với|voi|&|\+)\s+/i);
  if (splitWords.length >= 2) {
    return {
      personA: splitWords[0].trim(),
      personB: splitWords.slice(1).join(" ").trim(),
      rawQuery: body
    };
  }

  // TH3: Phân tách bởi dấu '-' ở giữa
  // Ví dụ: #tinhyeu Minh - 15/08/2000 - Lan - 01/02/2002
  const parts = body.split(/\s+-\s+/);
  if (parts.length === 4) {
    return {
      personA: parts[0] + " - " + parts[1],
      personB: parts[2] + " - " + parts[3],
      rawQuery: body
    };
  }

  // TH4: Cú pháp cũ "Nam 2002 Nu 2004"
  const genderYearRegex = /(nam\s*\d{2,4})\s*[-,&+]?\s*(nữ\s*\d{2,4}|nu\s*\d{2,4})/i;
  const gyMatch = body.match(genderYearRegex);
  if (gyMatch) {
    return {
      personA: gyMatch[1].replace(/nam/i, "Nam ").replace(/\s+/g, " ").trim(),
      personB: gyMatch[2].replace(/nu|nữ/i, "Nữ ").replace(/\s+/g, " ").trim(),
      rawQuery: body
    };
  }

  // Trường hợp phân tách bởi "-", "và", "va", "&", "với" tổng quát
  const splitParts = body.split(/\s+(?:và|va|với|voi|-|&|\+)\s+/i);
  if (splitParts.length >= 2) {
    return {
      personA: splitParts[0].trim(),
      personB: splitParts.slice(1).join(" ").trim(),
      rawQuery: body
    };
  }

  return {
    personA: defaultUser,
    personB: body,
    rawQuery: body
  };
}

/**
 * Kích hoạt Bói Ghép Đôi 2 Lá + Vòng Quay Năng Lượng Tình Duyên (Love Compatibility Radar)
 */
function triggerLoveMatchReading({ user = {}, personA = "Nam 2002", personB = "Nữ 2004" }) {
  const cards = drawRandomCards(2, "love");
  cards[0].positionLabel = `💖 Năng Lượng: ${personA}`;
  cards[0].assignedAspect = "love";
  cards[0].assignedTitle = `💖 Năng Lượng Tình Cảm Của ${personA}`;
  cards[0].assignedText = cards[0].love;

  cards[1].positionLabel = `💘 Năng Lượng: ${personB}`;
  cards[1].assignedAspect = "love";
  cards[1].assignedTitle = `💘 Năng Lượng Tình Cảm Của ${personB}`;
  cards[1].assignedText = cards[1].love;

  // Tính chỉ số hòa hợp huyền học (75% -> 99%)
  const seed =
    (cards[0].id * 7 + cards[1].id * 13 + personA.length * 11 + personB.length * 17) % 25;
  const score = 75 + seed;

  let matchTier = "Duyên Tiền Định Kiếp Trước";
  let matchAdvice =
    "Hai tần số năng lượng hút nhau cực mạnh! Hãy chủ động mở lời vì đối phương cũng đang hướng về bạn.";
  if (score >= 92) {
    matchTier = "Duyên Tiền Định — Tâm Đầu Ý Hợp";
    matchAdvice =
      "Độ hòa hợp tuyệt đỉnh! Hai lá bài cộng hưởng tạo nên mối nhân duyên bền chặt, ngọt ngào và thấu hiểu sâu sắc.";
  } else if (score >= 84) {
    matchTier = "Nhân Duyên Thăng Hoa — Nắng Ấm Giao Hòa";
    matchAdvice =
      "Hai bạn bù trừ khuyết điểm cho nhau rất tốt. Chỉ cần thêm những buổi hẹn hò chân thành là tình cảm bùng nổ!";
  } else {
    matchTier = "Tình Cảm Chớm Nở — Cần Lắng Nghe Nhau";
    matchAdvice =
      "Duyên phận đã gieo mầm nhưng cả hai còn hơi ngại ngùng. Hãy hạ bớt cái tôi để xích lại gần nhau hơn nhé!";
  }

  const readingPayload = {
    readingId: `lovematch_${Date.now()}`,
    spreadType: "love_match",
    cardCount: 2,
    cards,
    topic: "Bói Ghép Đôi Tình Duyên",
    loveMatch: {
      personA,
      personB,
      score,
      matchTier,
      matchAdvice
    },
    user: {
      uniqueId: user.uniqueId || "love_seeker",
      nickname: user.nickname || user.uniqueId || "Hữu Duyên",
      profilePictureUrl:
        user.profilePictureUrl ||
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
    },
    question: `Ghép đôi năng lượng: ${personA} ❤️ ${personB} — Độ hợp: ${score}% (${matchTier})`,
    reason: "love_compatibility_radar",
    timestamp: new Date().toISOString()
  };

  currentSessionReading = readingPayload;
  io.emit("tarot:draw", readingPayload);
  return readingPayload;
}

/**
 * Kiểm tra và trích xuất thông tin người xem từ bình luận TikTok Live
 * Cú pháp chuẩn: "Tên - Ngày tháng năm sinh"
 * Ví dụ:
 * - "Minh - 15/08/2000"
 * - "Lan - 2002"
 * - "Nguyễn Văn Tuấn - 05/11/1997 - Tình duyên sắp tới"
 * - "Mai Anh - 12.09.2001: Công việc tháng này thế nào?"
 * Fallback hỗ trợ cả: "Hỏi: [Câu hỏi]" hoặc câu kết thúc bằng "?"
 */
function parseSeekerComment(commentText = "", defaultNick = "") {
  const raw = String(commentText).trim();
  if (!raw) return null;

  // Bỏ tiền tố hỏi/bói/xem nếu có
  const clean = raw.replace(/^(?:hỏi|hoi|bói|boi|tarot|ask|xem|coi)\s*[:\-]?\s*/i, "").trim();

  // Pattern 1: Tên [Gạch ngang hoặc khoảng trắng] Ngày tháng năm sinh (hoặc năm sinh) [: hoặc - Câu hỏi]
  // Hỗ trợ cả:
  // - "Nam 20/7/2001 : Ngày mai có tỏ tình thành công không"
  // - "Nam 20/7/2001 Ngày mai có tỏ tình thành công không"
  // - "Nam - 20/7/2001"
  // - "Minh - 15/08/2000"
  // - "Minh 15/08/2000"
  // - "Lan 2002"
  // - "Lan - 2002"
  const match = clean.match(/^([a-zA-ZÀ-ỹ\s0-9_]{2,30}?)\s*[-–:]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\b(?:19|20)\d{2}\b)(?:\s*[-–:]?\s*(.+))?$/i);
  if (match) {
    const seekerName = match[1].trim();
    const seekerDob = match[2].trim();
    const extraQ = match[3] ? match[3].trim() : "";
    const questionText = extraQ ? `[${seekerName} - ${seekerDob}] ${extraQ}` : `Thông điệp Tarot cho ${seekerName} (sinh ${seekerDob})`;

    return {
      seekerName,
      seekerDob,
      extraQuestion: extraQ,
      question: questionText,
      formattedLabel: `${seekerName} - ${seekerDob}`
    };
  }

  // Pattern 2: Người xem gõ Tên rồi đến năm sinh bất kỳ
  const m2 = clean.match(/^(.+?)\s+((?:19|20)\d{2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(?:[-–:]?\s*(.+))?$/i);
  if (m2 && m2[1].trim().length >= 2) {
    const seekerName = m2[1].trim();
    const seekerDob = m2[2].trim();
    const extraQ = m2[3] ? m2[3].trim() : "";
    const questionText = extraQ ? `[${seekerName} - ${seekerDob}] ${extraQ}` : `Thông điệp Tarot cho ${seekerName} (sinh ${seekerDob})`;

    return {
      seekerName,
      seekerDob,
      extraQuestion: extraQ,
      question: questionText,
      formattedLabel: `${seekerName} - ${seekerDob}`
    };
  }

  // Fallback cho cú pháp cũ "Hỏi: [Câu hỏi]"
  const prefixRegex = /^(?:hỏi|hoi|bói|boi|tarot|ask)\s*[:\-]\s*(.+)$/i;
  const oldPrefixMatch = raw.match(prefixRegex);
  if (oldPrefixMatch && oldPrefixMatch[1].trim().length >= 3) {
    return {
      seekerName: defaultNick || "Hữu Duyên",
      seekerDob: "",
      extraQuestion: oldPrefixMatch[1].trim(),
      question: oldPrefixMatch[1].trim(),
      formattedLabel: oldPrefixMatch[1].trim()
    };
  }

  // Fallback câu hỏi có dấu hỏi chấm
  if (raw.endsWith("?") && raw.length >= 8) {
    return {
      seekerName: defaultNick || "Hữu Duyên",
      seekerDob: "",
      extraQuestion: raw,
      question: raw,
      formattedLabel: raw
    };
  }

  return null;
}

function parseQuestionFromComment(commentText = "") {
  const res = parseSeekerComment(commentText);
  return res ? res.question : null;
}

/**
 * Thêm hoặc nâng cấp ưu tiên câu hỏi vào hàng chờ
 */
function enqueueQuestion({
  uniqueId,
  nickname,
  profilePictureUrl,
  question,
  seekerName = null,
  seekerDob = null,
  displayLabel = null,
  isLoveMatch = false,
  loveMatchData = null,
  cardCount = 1,
  isPriority = false,
  isVipFastPass = false,
  giftName = null,
  diamondCount = 0,
  isMock = false
}) {
  const existingIndex = questionQueue.findIndex(
    (item) => item.uniqueId === uniqueId && item.status === "waiting"
  );

  if (existingIndex !== -1) {
    const existingItem = questionQueue[existingIndex];
    if (question) existingItem.question = question;
    if (seekerName) existingItem.seekerName = seekerName;
    if (seekerDob) existingItem.seekerDob = seekerDob;
    if (displayLabel) existingItem.displayLabel = displayLabel;
    if (isLoveMatch) {
      existingItem.isLoveMatch = true;
      existingItem.loveMatchData = loveMatchData;
    }
    if (cardCount) existingItem.cardCount = cardCount;
    if (isMock !== undefined) existingItem.isMock = Boolean(isMock);

    if (isVipFastPass) {
      existingItem.isVipFastPass = true;
      existingItem.isPriority = true;
      existingItem.giftName = giftName || existingItem.giftName;
      existingItem.diamondCount += diamondCount;
      questionQueue.splice(existingIndex, 1);
      questionQueue.unshift(existingItem); // Bay thẳng lên vị trí Số 1
      io.emit("queue:updated", questionQueue);
      return existingItem;
    }

    if (isPriority && !existingItem.isPriority) {
      existingItem.isPriority = true;
      existingItem.giftName = giftName || existingItem.giftName;
      existingItem.diamondCount += diamondCount;
      questionQueue.splice(existingIndex, 1);
      const firstNormalIndex = questionQueue.findIndex((q) => !q.isVipFastPass && !q.isPriority);
      if (firstNormalIndex === -1) {
        questionQueue.push(existingItem);
      } else {
        questionQueue.splice(firstNormalIndex, 0, existingItem);
      }
      io.emit("queue:updated", questionQueue);
      return existingItem;
    }

    // Nếu là người thật cập nhật lại câu hỏi nhưng đang bị xếp sau chim mồi:
    if (!existingItem.isMock) {
      const firstMockIndex = questionQueue.findIndex((q) => q.isMock);
      if (firstMockIndex !== -1 && existingIndex > firstMockIndex) {
        questionQueue.splice(existingIndex, 1);
        questionQueue.splice(firstMockIndex, 0, existingItem);
      }
    }

    io.emit("queue:updated", questionQueue);
    return existingItem;
  }

  const queueItem = {
    queueId: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    uniqueId: uniqueId || "anonymous",
    nickname: nickname || uniqueId || "Người xem ẩn danh",
    profilePictureUrl:
      profilePictureUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
    question: question || "Xin thông điệp vũ trụ tổng quan (Tình duyên & Công việc)",
    seekerName,
    seekerDob,
    displayLabel: displayLabel || (seekerName ? `${seekerName}${seekerDob ? ` - ${seekerDob}` : ""}` : nickname),
    isLoveMatch: Boolean(isLoveMatch),
    loveMatchData: loveMatchData || null,
    cardCount: Number(cardCount) || 1,
    isPriority: Boolean(isPriority || isVipFastPass),
    isVipFastPass: Boolean(isVipFastPass),
    isMock: Boolean(isMock),
    giftName,
    diamondCount: Number(diamondCount) || 0,
    status: "waiting",
    createdAt: new Date().toISOString()
  };

  if (queueItem.isVipFastPass) {
    // 1. VIP FastPass: Luôn đứng vị trí số 1
    questionQueue.unshift(queueItem);
  } else if (queueItem.isPriority) {
    // 2. VIP Quà tặng: Đứng sau VIP FastPass, trước khách thường và comment ảo
    const firstNormalIndex = questionQueue.findIndex((q) => !q.isVipFastPass && !q.isPriority);
    if (firstNormalIndex === -1) {
      questionQueue.push(queueItem);
    } else {
      questionQueue.splice(firstNormalIndex, 0, queueItem);
    }
  } else if (!queueItem.isMock) {
    // 3. KHÁCH LIVE THẬT TRÊN TIKTOK:
    // ƯU TIÊN LÊN ĐẦU TIÊN (NGAY SAU COMMENT ĐANG ĐỌC & TRÊN TẤT CẢ COMMENT ẢO CHIM MỒI)!
    // Tìm vị trí của comment ảo (chim mồi) đầu tiên trong hàng chờ:
    const firstMockIndex = questionQueue.findIndex((q) => q.isMock);
    if (firstMockIndex === -1) {
      // Hàng chờ chưa có chim mồi nào -> xếp nối tiếp sau các khách thật khác
      questionQueue.push(queueItem);
    } else {
      // Chèn ngay trước comment ảo đầu tiên!
      // (Nghĩa là đứng ngay sau các khách thật khác và TRÊN ĐẦU tất cả comment ảo!)
      questionQueue.splice(firstMockIndex, 0, queueItem);
    }
  } else {
    // 4. COMMENT ẢO (CHIM MỒI): Luôn xếp ở cuối cùng của hàng chờ để nhường chỗ cho khách thật
    questionQueue.push(queueItem);
  }

  io.emit("queue:updated", questionQueue);
  return queueItem;
}

/**
 * Xử lý sự kiện Chat từ TikTok Live hoặc Mock
 */
function handleChatEvent(data, isMock = false) {
  const uniqueId = data.uniqueId || data.userId || (data.user && data.user.uniqueId) || "user_tiktok";
  const nickname = data.nickname || (data.user && data.user.nickname) || uniqueId;
  const comment = String(data.comment || data.content || data.text || data.questionText || "").trim();
  const profilePictureUrl = data.profilePictureUrl || (data.user && data.user.profilePictureUrl) || "";
  const itemIsMock = data.isMock !== undefined ? Boolean(data.isMock) : Boolean(isMock);

  console.log(`💬 [${itemIsMock ? "Chim Mồi Mock" : "TikTok Live Thật"}] @${uniqueId} (${nickname}): "${comment}"`);

  // 0. Kiểm tra cú pháp thanh tẩy bài (#thanh_tay hoặc #thanhtay)
  if (/(?:#thanh_tay|#thanhtay|#cleanse)/i.test(comment)) {
    cleanseCount += 1;
    const cleansePayload = {
      cleanseId: `cleanse_${Date.now()}_${cleanseCount}`,
      cleanseCount,
      triggeredBy: nickname,
      totalLikes,
      message: `🔔 Khán giả @${uniqueId} vừa gõ #thanh_tay để thanh tẩy bộ bài!`,
      timestamp: new Date().toISOString()
    };
    io.emit("tarot:cleanse", cleansePayload);
    io.emit("tiktok:chat", {
      uniqueId,
      nickname,
      comment,
      profilePictureUrl,
      matched: true,
      isMock: itemIsMock,
      type: "cleanse",
      label: "🔔 Thanh Tẩy Bài",
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 1. Kiểm tra cú pháp Bói Ghép Đôi (#tinhyeu "Tên - Ngày sinh" "Tên - Ngày sinh")
  const loveMatchData = parseLoveMatchFromComment(comment, nickname);
  if (loveMatchData) {
    const queuedItem = enqueueQuestion({
      uniqueId,
      nickname,
      profilePictureUrl,
      question: comment,
      isLoveMatch: true,
      loveMatchData,
      displayLabel: `${loveMatchData.personA} ❤️ ${loveMatchData.personB}`,
      isPriority: false,
      isMock: itemIsMock
    });

    console.log(`✅ [Hàng Chờ] Đã xếp hàng Bói Ghép Đôi của @${uniqueId}: ${loveMatchData.personA} ❤️ ${loveMatchData.personB} (isMock: ${itemIsMock})`);

    io.emit("tiktok:chat", {
      uniqueId,
      nickname,
      comment,
      profilePictureUrl,
      matched: true,
      isMock: itemIsMock,
      type: "love_match",
      label: `${loveMatchData.personA} ❤️ ${loveMatchData.personB}`,
      timestamp: new Date().toISOString()
    });

    io.emit("chat:question", queuedItem);
    if (currentReadingState === "idle") {
      processNextQueueItem();
    }
    return;
  }

  // 2. Kiểm tra cú pháp bình luận bói bài (Tên - Ngày tháng năm sinh) hoặc câu hỏi
  const seekerData = parseSeekerComment(comment, nickname);
  if (seekerData) {
    const queuedItem = enqueueQuestion({
      uniqueId,
      nickname,
      profilePictureUrl,
      seekerName: seekerData.seekerName,
      seekerDob: seekerData.seekerDob,
      question: seekerData.question,
      displayLabel: seekerData.formattedLabel,
      isPriority: false,
      isMock: itemIsMock
    });

    console.log(`✅ [Hàng Chờ] Đã xếp hàng Bói Bài của @${uniqueId}: ${seekerData.formattedLabel} (isMock: ${itemIsMock})`);

    io.emit("tiktok:chat", {
      uniqueId,
      nickname,
      comment,
      profilePictureUrl,
      matched: true,
      isMock: itemIsMock,
      type: "single",
      label: seekerData.formattedLabel,
      timestamp: new Date().toISOString()
    });

    io.emit("chat:question", queuedItem);
    if (currentReadingState === "idle") {
      processNextQueueItem();
    }
    return;
  }

  // Nếu là bình luận thông thường không đúng cú pháp bói
  io.emit("tiktok:chat", {
    uniqueId,
    nickname,
    comment,
    profilePictureUrl,
    matched: false,
    isMock: itemIsMock,
    timestamp: new Date().toISOString()
  });
}

/**
 * Kích hoạt "Mở Khóa Tụ Bài Bí Ẩn / Trải Bài Vũ Trụ Chung" khi đầy Thanh Năng Lượng Tập Thể
 * (Đạt 5.000 Tim hoặc 50 Lượt Chia Sẻ) -> Nổ Pháo Hoa Sao Băng & Bốc 1 Lá Bài Chung Cho Toàn Phòng Live!
 */
function triggerGlobalMysterySpread({ triggeredBy = "Toàn Thể Phòng Live", triggerSource = "likes" } = {}) {
  globalEnergyLikes = 0;
  globalEnergyShares = 0;
  globalUnlockCount += 1;

  const communalQuestion =
    "☄️ [TỤ BÀI BÍ ẨN TOÀN PHÒNG LIVE] Thông điệp Vũ Trụ chung dành cho tất cả khán giả đang thả tim & chia sẻ phiên Live!";
  const cards = drawRandomCards(1, "advice", communalQuestion);
  const c = cards[0];
  const orientText = c.isReversed ? "chiều Ngược" : "chiều Xuôi";
  const kwText = (c.keywords || []).slice(0, 3).join(", ").toLowerCase();

  c.positionLabel = "🌌 TỤ BÀI BÍ ẨN TOÀN PHÒNG LIVE";
  c.assignedTitle = "🌌 Thông Điệp Tụ Bài Bí Ẩn Toàn Phòng Live";
  c.cardExplanation = `Lá bài Vũ Trụ ${c.name} (${orientText}) vừa được mở khóa bởi năng lượng tập thể (${kwText}): ${c.advice}`;
  c.questionConclusion = `Chốt lại cho toàn bộ khán giả đang xem Live: Năng lượng thiện lành từ hàng ngàn lượt thả tim và chia sẻ đang thu hút may mắn, tình duyên khởi sắc và tài lộc bất ngờ đến với tất cả các bạn trong tuần này!`;

  const readingPayload = {
    readingId: `global_mystery_${Date.now()}`,
    spreadType: "global_mystery",
    isGlobalMystery: true,
    cardCount: 1,
    cards,
    topic: "Tụ Bài Bí Ẩn Vũ Trụ",
    detectedAspect: "advice",
    user: {
      uniqueId: "Toàn_Phòng_Live",
      nickname: `🌌 Toàn Phòng Live (#${globalUnlockCount})`
    },
    question: communalQuestion,
    reason: `global_energy_unlock_${triggerSource}`,
    triggeredBy,
    unlockCount: globalUnlockCount,
    timestamp: new Date().toISOString()
  };

  currentSessionReading = readingPayload;

  io.emit("tarot:global_unlock", {
    unlockCount: globalUnlockCount,
    triggeredBy,
    triggerSource,
    reading: readingPayload,
    energy: getGlobalEnergyState("unlock"),
    message: `☄️ NỔ PHÁO HOA SAO BĂNG! Năng lượng tập thể đạt 100% — Mở khóa Tụ Bài Bí Ẩn "${c.name}" cho toàn phòng Live!`,
    timestamp: new Date().toISOString()
  });

  io.emit("tarot:draw", readingPayload);
  io.emit("energy:update", getGlobalEnergyState("reset"));
  return readingPayload;
}

/**
 * Xử lý sự kiện Chia sẻ (Share) phiên Live (Cần 50 Share để mở khóa Tụ Bài Bí Ẩn)
 */
function handleShareEvent(data = {}) {
  const shareCount = Math.max(Number(data.shareCount) || 1, 1);
  const uniqueId = data.uniqueId || "sharer";
  const nickname = data.nickname || uniqueId;

  totalShares += shareCount;
  globalEnergyShares += shareCount;

  const energyState = getGlobalEnergyState("share");
  io.emit("energy:update", energyState);

  if (energyState.percent >= 100) {
    triggerGlobalMysterySpread({ triggeredBy: nickname, triggerSource: "shares" });
  }
}

/**
 * Xử lý sự kiện Like (Tích lũy đủ 50 tim sẽ bắn sự kiện thanh tẩy bài + Cộng vào Thanh Năng Lượng Tập Thể 5.000 Tim)
 */
function handleLikeEvent(data) {
  const likeCount = Math.max(Number(data.likeCount) || 1, 1);
  const uniqueId = data.uniqueId || "viewer";
  const nickname = data.nickname || uniqueId;

  totalLikes += likeCount;
  likeBuffer += likeCount;
  globalEnergyLikes += likeCount;

  const energyState = getGlobalEnergyState("like");

  io.emit("tiktok:like", {
    uniqueId,
    nickname,
    likeCount,
    totalLikes,
    likeProgress: likeBuffer % CLEANSE_LIKE_THRESHOLD,
    threshold: CLEANSE_LIKE_THRESHOLD,
    energy: energyState
  });

  io.emit("energy:update", energyState);

  while (likeBuffer >= CLEANSE_LIKE_THRESHOLD) {
    likeBuffer -= CLEANSE_LIKE_THRESHOLD;
    cleanseCount += 1;

    const cleansePayload = {
      cleanseId: `cleanse_${Date.now()}_${cleanseCount}`,
      cleanseCount,
      triggeredBy: nickname,
      totalLikes,
      message: `✨ Năng lượng từ ${totalLikes} lượt Tim đã thanh tẩy bộ bài Tarot thiêng liêng!`,
      timestamp: new Date().toISOString()
    };

    io.emit("tarot:cleanse", cleansePayload);
  }

  if (energyState.percent >= 100) {
    triggerGlobalMysterySpread({ triggeredBy: nickname, triggerSource: "likes" });
  }
}

/**
 * Thực hiện rút bài và phát sự kiện xuống OBS Overlay & Admin
 */
function triggerTarotDraw({
  cardCount = 1,
  user = {},
  question = "",
  reason = "manual",
  giftInfo = null,
  isVipFastPass = false
}) {
  const loveMatchFromQ = parseLoveMatchFromComment(question, user?.nickname || user?.uniqueId || "Bạn");
  if (loveMatchFromQ && !isVipFastPass) {
    return triggerLoveMatchReading({
      user,
      personA: loveMatchFromQ.personA,
      personB: loveMatchFromQ.personB
    });
  }

  const detectedAspect = detectQuestionAspect(question, currentTopic);
  const cards = drawRandomCards(cardCount, detectedAspect, question);

  const seekerInfo = parseSeekerComment(question, user?.nickname || user?.uniqueId || "");
  const seekerName = user?.seekerName || seekerInfo?.seekerName || user?.nickname || null;
  const seekerDob = user?.seekerDob || seekerInfo?.seekerDob || null;
  const displayLabel = user?.displayLabel || seekerInfo?.formattedLabel || null;

  const readingPayload = {
    readingId: `read_${Date.now()}`,
    spreadType: cardCount === 3 ? "three_cards" : "single_card",
    cardCount: cards.length,
    cards,
    topic: currentTopic,
    detectedAspect,
    seekerName,
    seekerDob,
    displayLabel,
    isVipFastPass: Boolean(isVipFastPass),
    user: {
      uniqueId: user.uniqueId || "guest",
      nickname: user.nickname || user.uniqueId || "Hữu Duyên",
      profilePictureUrl:
        user.profilePictureUrl ||
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
    },
    question:
      question ||
      (cardCount === 3
        ? `Trải bài 3 lá: Lá 1 Tình Yêu — Lá 2 Công Việc — Lá 3 Lời Khuyên`
        : `Xin thông điệp chủ đề: ${currentTopic}`),
    reason,
    giftInfo,
    timestamp: new Date().toISOString()
  };

  currentSessionReading = readingPayload;
  io.emit("tarot:draw", readingPayload);
  return readingPayload;
}

/**
 * Xử lý sự kiện Gift (Tặng quà TikTok Live hoặc Mock)
 * - Quà nhỏ (1 - 9 xu): Kích hoạt bốc 1 lá
 * - Quà vừa (10 - 49 xu): Kích hoạt trải 3 lá + ưu tiên hàng chờ
 * - Quà VIP Fast-Pass (50+ xu hoặc Nước hoa / Mũ miện / Vương miện):
 *   Kích hoạt hiệu ứng "VIP BẬT ĐÈN", bay thẳng lên vị trí Số 1 khung viền Neon Mạ Vàng và bốc bài ngay lập tức!
 */
function handleGiftEvent(data) {
  if (data.giftType === 1 && !data.repeatEnd) {
    return;
  }

  const repeatCount = Math.max(Number(data.repeatCount) || 1, 1);
  const unitDiamond = Math.max(Number(data.diamondCount) || 1, 1);
  const totalCoins = unitDiamond * repeatCount;

  const uniqueId = data.uniqueId || "vip_viewer";
  const nickname = data.nickname || uniqueId;
  const profilePictureUrl = data.profilePictureUrl || "";
  const giftName = data.giftName || "Quà Tặng Tinh Tú";

  const specialVipGiftRegex = /(nước hoa|nuoc hoa|perfume|mũ miện|mu mien|vương miện|vuong mien|crown)/i;
  const isVipFastPass = totalCoins >= 50 || specialVipGiftRegex.test(giftName) || Boolean(data.forceFastPass);
  const isBigGift = isVipFastPass || totalCoins >= 10;
  const cardCount = isBigGift ? 3 : 1;

  // Tìm xem người tặng quà đã đặt câu hỏi trong hàng chờ chưa
  const existingQueueItem = questionQueue.find((q) => q.uniqueId === uniqueId);
  const userQuestion =
    data.question ||
    (existingQueueItem ? existingQueueItem.question : null) ||
    (isVipFastPass
      ? `[VIP MẠ VÀNG] Trải 3 lá Đặc Quyền cho ${nickname} (${giftName})`
      : isBigGift
      ? `Trải 3 lá VIP cho ${nickname} (Tình Duyên - Sự Nghiệp - Lời Khuyên)`
      : `Thông điệp 1 lá hữu duyên gửi tới ${nickname}`);

  let priorityQueueItem = null;
  if (isBigGift) {
    priorityQueueItem = enqueueQuestion({
      uniqueId,
      nickname,
      profilePictureUrl,
      question: userQuestion,
      isPriority: true,
      isVipFastPass,
      giftName,
      diamondCount: totalCoins
    });
  }

  const giftInfo = {
    giftId: data.giftId || 0,
    giftName,
    repeatCount,
    unitDiamond,
    totalCoins,
    isVipFastPass,
    tier: isVipFastPass ? "VIP_FAST_PASS_GOLD" : isBigGift ? "VIP_3_CARDS" : "STANDARD_1_CARD"
  };

  if (isVipFastPass) {
    io.emit("tarot:vip_fastpass", {
      uniqueId,
      nickname,
      giftName,
      totalCoins,
      question: userQuestion,
      message: `🚨 VIP BẬT ĐÈN! @${uniqueId} tặng ${giftName} (${totalCoins} xu) — Bay thẳng lên Top 1 & Bốc Bài Ngay!`,
      timestamp: new Date().toISOString()
    });
  }

  io.emit("tiktok:gift", {
    uniqueId,
    nickname,
    profilePictureUrl,
    ...giftInfo,
    priorityQueueItem,
    timestamp: new Date().toISOString()
  });

  if (currentReadingState === "idle") {
    currentReadingState = "reading";
    const reading = triggerTarotDraw({
      cardCount,
      user: { uniqueId, nickname, profilePictureUrl },
      question: userQuestion,
      reason: isVipFastPass ? "vip_fastpass_gold" : isBigGift ? "gift_vip_3_cards" : "gift_standard_1_card",
      giftInfo,
      isVipFastPass
    });
    const activeId = reading?.readingId || `read_${Date.now()}`;
    currentActiveReadingId = activeId;
    if (readingSafetyTimer) clearTimeout(readingSafetyTimer);
    readingSafetyTimer = setTimeout(() => {
      if (currentActiveReadingId === activeId && currentReadingState === "reading") {
        handleReadingFinished(activeId);
      }
    }, 45000);
    return reading;
  } else {
    // Đang có người đọc dở -> đưa vào hàng chờ ưu tiên để đọc ngay sau khi người hiện tại hoàn tất
    if (!priorityQueueItem) {
      priorityQueueItem = enqueueQuestion({
        uniqueId,
        nickname,
        profilePictureUrl,
        question: userQuestion,
        cardCount,
        isPriority: true,
        isVipFastPass,
        giftName,
        diamondCount: totalCoins
      });
    }
    console.log(`🎁 [Quà tặng] Đang đọc bài khác, đã xếp quà của @${uniqueId} vào đầu hàng chờ.`);
    return null;
  }
}

// ==================== KẾT NỐI TIKTOK LIVE CONNECTOR ====================

async function connectToTikTokLive(uniqueId, customOptions = {}) {
  const cleanId = String(uniqueId || "")
    .trim()
    .replace(/^@/, "");

  if (!cleanId) {
    throw new Error("Vui lòng nhập TikTok Username (uniqueId) hợp lệ.");
  }

  // Ngắt kết nối phiên cũ nếu đang tồn tại
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (_) {
      // Bỏ qua lỗi khi đóng kết nối cũ
    }
    tiktokConnection = null;
  }

  currentUniqueId = cleanId;
  isConnectedToTikTok = false;

  io.emit("tiktok:status", {
    status: "connecting",
    uniqueId: cleanId,
    message: `Đang kết nối tới phiên Live của @${cleanId}...`
  });

  const connectionOptions = {
    processInitialData: false,
    enableExtendedGiftInfo: false, // Bắt buộc false: tránh EulerStream yêu cầu gói Business trả phí
    fetchRoomInfoOnConnect: false, // Bỏ qua kiểm tra status 4 để kết nối thẳng WebSocket
    enableWebsocketUpgrade: true,
    requestPollingIntervalMs: 2000
  };

  const effectiveKey = customOptions.signApiKey || process.env.SIGN_API_KEY;
  if (effectiveKey && effectiveKey.trim()) {
    connectionOptions.signApiKey = effectiveKey.trim();
    SignConfig.apiKey = effectiveKey.trim();
    SignConfig.cachedInstance = undefined; // Ép tạo lại instance mới với key này
  } else {
    SignConfig.apiKey = undefined;
    SignConfig.cachedInstance = undefined; // Rất quan trọng: xóa sạch instance cũ đã lưu key free trong bộ nhớ!
    delete connectionOptions.signApiKey;
  }

  if (customOptions.sessionId && customOptions.sessionId.trim()) {
    connectionOptions.session = {
      cookie: {
        sessionId: customOptions.sessionId.trim(),
        ttTargetIdc: "useast1a"
      }
    };
  }

  tiktokConnection = new WebcastPushConnection(cleanId, connectionOptions);

  // Lắng nghe các sự kiện TikTok Live (Khách thật -> isMock = false)
  tiktokConnection.on("chat", (data) => handleChatEvent(data, false));
  tiktokConnection.on("questionNew", (data) => handleChatEvent(data, false));
  tiktokConnection.on("barrage", (data) => handleChatEvent(data, false));
  tiktokConnection.on("like", (data) => handleLikeEvent(data));
  tiktokConnection.on("gift", (data) => handleGiftEvent(data));

  // Sự kiện người xem mới vào phòng Live hoặc Follow/Share (Hỗ trợ tương tác TikTok Live Studio)
  tiktokConnection.on("member", (data) => {
    io.emit("tiktok:member", {
      uniqueId: data.uniqueId || "viewer",
      nickname: data.nickname || data.uniqueId || "Khách mới",
      profilePictureUrl: data.profilePictureUrl || "",
      timestamp: new Date().toISOString()
    });
  });

  tiktokConnection.on("social", (data) => {
    const dType = String(data.displayType || "").toLowerCase();
    const lbl = String(data.label || "").toLowerCase();
    if (dType.includes("share") || lbl.includes("share") || lbl.includes("chia sẻ")) {
      handleShareEvent({
        uniqueId: data.uniqueId || "viewer",
        nickname: data.nickname || data.uniqueId || "Người xem",
        shareCount: 1
      });
    }
    io.emit("tiktok:social", {
      uniqueId: data.uniqueId || "viewer",
      nickname: data.nickname || data.uniqueId || "Người xem",
      displayType: data.displayType || "follow",
      label: data.label || "đã theo dõi phiên Live!",
      timestamp: new Date().toISOString()
    });
  });

  tiktokConnection.on("share", (data) => {
    handleShareEvent({
      uniqueId: data?.uniqueId || "viewer",
      nickname: data?.nickname || data?.uniqueId || "Người xem",
      shareCount: 1
    });
  });

  tiktokConnection.on("streamEnd", () => {
    isConnectedToTikTok = false;
    io.emit("tiktok:status", {
      status: "ended",
      uniqueId: cleanId,
      message: `Phiên Livestream của @${cleanId} đã kết thúc.`
    });
  });

  tiktokConnection.on("disconnected", () => {
    isConnectedToTikTok = false;
    io.emit("tiktok:status", {
      status: "disconnected",
      uniqueId: cleanId,
      message: `Đã ngắt kết nối với @${cleanId}.`
    });
  });

  tiktokConnection.on("error", (err) => {
    io.emit("tiktok:error", {
      uniqueId: cleanId,
      error: err?.message || String(err)
    });
  });

  try {
    const state = await tiktokConnection.connect();
    isConnectedToTikTok = true;

    const statusPayload = {
      status: "connected",
      uniqueId: cleanId,
      roomId: state.roomId,
      message: `🟢 Đã kết nối thành công tới TikTok Live @${cleanId} (Room ID: ${state.roomId})`
    };

    io.emit("tiktok:status", statusPayload);
    return statusPayload;
  } catch (err) {
    isConnectedToTikTok = false;
    tiktokConnection = null;
    SignConfig.apiKey = undefined;
    SignConfig.cachedInstance = undefined;
    let userMsg = err?.message || String(err);
    const errName = err?.name || "";

    if (
      userMsg.includes("isn't online") ||
      userMsg.includes("not online") ||
      userMsg.includes("UserOffline") ||
      userMsg.includes("Failed to retrieve Room ID") ||
      errName === "UserOfflineError"
    ) {
      userMsg = `🔴 Tài khoản @${cleanId} hiện TikTok báo KHÔNG PHÁT TRỰC TIẾP (Chưa bật Live hoặc phiên Live vừa kết thúc). Hãy chắc chắn bạn đã nhấn "Bắt đầu phát trực tiếp" trên TikTok Live Studio hoặc trên điện thoại và luồng live đang phát hình cho người xem!`;
    } else if (userMsg.includes("Business plan") || userMsg.includes("401")) {
      userMsg = `⚠️ EulerStream API Key bạn vừa nhập là tài khoản miễn phí nên không thể dùng cho tính năng này. Hãy XÓA TRỐNG ô EulerStream API Key để hệ thống kết nối trực tiếp miễn phí!`;
    } else if (userMsg.includes("403") || userMsg.includes("sign")) {
      userMsg = `TikTok hạn chế ký kết nối (403). Hãy xóa trống ô EulerStream API Key hoặc dán TikTok Session ID (lấy từ cookie sessionid trên trình duyệt) trong mục Cài đặt nâng cao!`;
    }
    throw new Error(userMsg);
  }
}

function disconnectFromTikTokLive() {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (_) {
      // Bỏ qua lỗi khi ngắt kết nối
    }
    tiktokConnection = null;
  }
  const previousId = currentUniqueId;
  isConnectedToTikTok = false;
  currentUniqueId = null;

  const payload = {
    status: "disconnected",
    uniqueId: previousId,
    message: "Đã ngắt kết nối TikTok Live."
  };
  io.emit("tiktok:status", payload);
  return payload;
}

// ==================== REST API ENDPOINTS ====================

// Lấy trạng thái tổng quan của Server, bộ bài và hàng chờ
app.get("/api/state", (req, res) => {
  res.json({
    ok: true,
    topic: currentTopic,
    studioConfig,
    tiktok: {
      isConnected: isConnectedToTikTok,
      uniqueId: currentUniqueId
    },
    stats: {
      totalLikes,
      likeProgress: likeBuffer,
      cleanseThreshold: CLEANSE_LIKE_THRESHOLD,
      cleanseCount,
      deckSize: TAROT_DATA.length
    },
    queue: questionQueue,
    currentReading: currentSessionReading
  });
});

// Cập nhật cấu hình TikTok Live Studio
app.post("/api/studio/config", (req, res) => {
  studioConfig = {
    ...studioConfig,
    ...(req.body || {})
  };
  restartAutoDrawTimer();
  io.emit("studio:config_updated", studioConfig);
  res.json({ ok: true, studioConfig });
});

/**
 * Chia văn bản Tiếng Việt dài thành các đoạn ngắn tự nhiên (<= 170 ký tự)
 * để tổng hợp giọng nữ Tiếng Việt mượt mà không bị ngắt chữ
 */
function splitVietnameseTextIntoChunks(text, maxLen = 170) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return [];

  const sentences = clean.split(/(?<=[.!?;,।])\s+/);
  const chunks = [];
  let current = "";

  for (const s of sentences) {
    if ((current + " " + s).trim().length <= maxLen) {
      current = (current + " " + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Cắt theo từ nếu câu quá dài
        const words = s.split(" ");
        let temp = "";
        for (const w of words) {
          if ((temp + " " + w).trim().length <= maxLen) {
            temp = (temp + " " + w).trim();
          } else {
            if (temp) chunks.push(temp);
            temp = w;
          }
        }
        current = temp;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function fetchSingleTtsChunkMp3(chunkText) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(chunkText);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encoded}`;

    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Referer: "https://translate.google.com/"
          }
        },
        (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`TTS HTTP ${response.statusCode}`));
            return;
          }
          const dataBuffers = [];
          response.on("data", (chunk) => dataBuffers.push(chunk));
          response.on("end", () => resolve(Buffer.concat(dataBuffers)));
        }
      )
      .on("error", reject);
  });
}

// Endpoint trả về luồng âm thanh Giọng Nữ Tiếng Việt tự nhiên cho Cô Phù Thủy
app.get("/api/tts", async (req, res) => {
  try {
    const rawText = String(req.query.text || "").trim();
    if (!rawText) {
      return res.status(400).json({ ok: false, error: "Thiếu nội dung text" });
    }

    const chunks = splitVietnameseTextIntoChunks(rawText, 165);
    const mp3Buffers = [];
    for (const chunk of chunks) {
      const buf = await fetchSingleTtsChunkMp3(chunk);
      mp3Buffers.push(buf);
    }

    const combinedMp3 = Buffer.concat(mp3Buffers);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": combinedMp3.length,
      "Cache-Control": "no-cache"
    });
    res.send(combinedMp3);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Thư mục cache ảnh bài Tarot Rider-Waite-Smith 1909 thật trên ổ đĩa
const CARDS_CACHE_DIR = path.join(__dirname, "public", "cards");
if (!fs.existsSync(CARDS_CACHE_DIR)) {
  try {
    fs.mkdirSync(CARDS_CACHE_DIR, { recursive: true });
  } catch (_) {}
}

function downloadBufferFromUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
          }
        },
        (resp) => {
          if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
            return downloadBufferFromUrl(resp.headers.location).then(resolve).catch(reject);
          }
          if (resp.statusCode !== 200) {
            return reject(new Error(`HTTP ${resp.statusCode}`));
          }
          const chunks = [];
          resp.on("data", (c) => chunks.push(c));
          resp.on("end", () => resolve(Buffer.concat(chunks)));
        }
      )
      .on("error", reject);
  });
}

// Endpoint tải & lưu cache bộ ảnh 78 lá bài Tarot Rider-Waite-Smith (1909) thật
app.get("/api/card-img/:code", async (req, res) => {
  const cleanCode = String(req.params.code || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!cleanCode) {
    return res.status(400).end();
  }

  const cachedFilePath = path.join(CARDS_CACHE_DIR, `${cleanCode}.jpg`);
  if (fs.existsSync(cachedFilePath)) {
    res.set("Cache-Control", "public, max-age=604800");
    return res.sendFile(cachedFilePath);
  }

  const mirrorUrls = [
    `https://cdn.jsdelivr.net/gh/metabismuth/tarot-json@master/cards/${cleanCode}.jpg`,
    `https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/${cleanCode}.jpg`
  ];

  for (const url of mirrorUrls) {
    try {
      const imgBuf = await downloadBufferFromUrl(url);
      if (imgBuf && imgBuf.length > 1000) {
        try {
          fs.writeFileSync(cachedFilePath, imgBuf);
        } catch (_) {}
        res.set({
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800"
        });
        return res.send(imgBuf);
      }
    } catch (_) {}
  }

  res.status(404).end();
});

// Đổi chủ đề phiên Live
app.post("/api/topic", (req, res) => {
  const { topic } = req.body || {};
  if (topic) {
    currentTopic = String(topic).trim();
    io.emit("topic:updated", { topic: currentTopic, timestamp: new Date().toISOString() });
  }
  res.json({ ok: true, topic: currentTopic });
});

// Lấy toàn bộ dữ liệu 78 lá bài Tarot qua API
app.get("/api/tarot/cards", (req, res) => {
  res.json({
    ok: true,
    total: TAROT_DATA.length,
    cards: TAROT_DATA
  });
});

// Kết nối TikTok Live từ Admin Panel
app.post("/api/tiktok/connect", async (req, res) => {
  const { uniqueId } = req.body;
  try {
    const status = await connectToTikTokLive(uniqueId);
    res.json({ ok: true, ...status });
  } catch (error) {
    io.emit("tiktok:status", {
      status: "error",
      uniqueId,
      message: `Không thể kết nối tới @${uniqueId}: ${error.message}`
    });
    res.status(400).json({
      ok: false,
      error: error.message || "Không thể kết nối TikTok Live (Hãy kiểm tra tài khoản có đang phát trực tiếp không)."
    });
  }
});

// Ngắt kết nối TikTok Live
app.post("/api/tiktok/disconnect", (req, res) => {
  const status = disconnectFromTikTokLive();
  res.json({ ok: true, ...status });
});

// ==================== API GIẢ LẬP (MOCK EVENTS CHO ADMIN PANEL) ====================

// Mock sự kiện bình luận đặt câu hỏi (Chim mồi)
app.post("/api/mock/chat", (req, res) => {
  const {
    uniqueId = "tarot_lover_99",
    nickname = "Ngọc Ánh ✨",
    comment = "Hỏi: Tháng này chuyện tình cảm của mình có khởi sắc không ạ?",
    profilePictureUrl = ""
  } = req.body || {};

  handleChatEvent({ uniqueId, nickname, comment, profilePictureUrl, isMock: true }, true);
  res.json({ ok: true, message: "Đã giả lập sự kiện Chat thành công.", queue: questionQueue });
});

// Giả lập sự kiện bình luận từ Khách Live Thật trên TikTok (isMock = false)
app.post("/api/live/chat", (req, res) => {
  const {
    uniqueId = "real_viewer_1",
    nickname = "Khách Live Thật 🌸",
    comment = "Hoàng - 05/10/2001 : Ngày mai thi có tốt không",
    profilePictureUrl = ""
  } = req.body || {};

  handleChatEvent({ uniqueId, nickname, comment, profilePictureUrl, isMock: false }, false);
  res.json({ ok: true, message: "Đã gửi bình luận từ Khách Live Thật thành công.", queue: questionQueue });
});

// Mock sự kiện thả tim (Mặc định có thể truyền likeCount = 50 để kích hoạt thanh tẩy bài ngay)
app.post("/api/mock/like", (req, res) => {
  const {
    uniqueId = "heart_sender",
    nickname = "Minh Tâm 💖",
    likeCount = 25
  } = req.body || {};

  handleLikeEvent({ uniqueId, nickname, likeCount: Number(likeCount) || 25 });
  res.json({
    ok: true,
    totalLikes,
    likeProgress: likeBuffer,
    cleanseCount
  });
});

// Mock sự kiện tặng quà (1-9 xu: rút 1 lá | 10+ xu: trải 3 lá + ưu tiên câu hỏi)
app.post("/api/mock/gift", (req, res) => {
  const {
    uniqueId = "vip_patron_88",
    nickname = "Hoàng Tử Sao Đêm 👑",
    giftName = "Hoa Hồng Tinh Tú",
    diamondCount = 1,
    repeatCount = 1,
    question = ""
  } = req.body || {};

  const reading = handleGiftEvent({
    uniqueId,
    nickname,
    giftName,
    diamondCount: Number(diamondCount) || 1,
    repeatCount: Number(repeatCount) || 1,
    giftType: 0,
    repeatEnd: true,
    question
  });

  res.json({
    ok: true,
    message: "Đã giả lập sự kiện Tặng Quà thành công.",
    reading
  });
});

// Mock bốc bài trực tiếp từ Admin (1 lá hoặc 3 lá)
app.post("/api/mock/draw", (req, res) => {
  const {
    cardCount = 1,
    uniqueId = "admin_pick",
    nickname = "Khách Hữu Duyên",
    question = ""
  } = req.body || {};

  const reading = triggerTarotDraw({
    cardCount: Number(cardCount) === 3 ? 3 : 1,
    user: { uniqueId, nickname },
    question,
    reason: "admin_manual_draw"
  });

  res.json({ ok: true, reading });
});

// Mock kích hoạt thanh tẩy bài ngay lập tức
app.post("/api/mock/cleanse", (req, res) => {
  cleanseCount += 1;
  const cleansePayload = {
    cleanseId: `cleanse_${Date.now()}_${cleanseCount}`,
    cleanseCount,
    triggeredBy: req.body?.nickname || "Reader Thanh Tẩy",
    totalLikes,
    message: "✨ Bộ bài đã được thanh tẩy năng lượng trực tiếp bởi Tarot Reader!",
    timestamp: new Date().toISOString()
  };
  io.emit("tarot:cleanse", cleansePayload);
  res.json({ ok: true, cleanse: cleansePayload });
});

// ==================== SOCKET.IO REALTIME EVENTS ====================

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client đã kết nối: ${socket.id}`);

  // Gửi ngay trạng thái hiện tại cho Client vừa kết nối (OBS Overlay hoặc Admin Panel)
  socket.emit("state:init", {
    topic: currentTopic,
    studioConfig,
    tiktok: {
      isConnected: isConnectedToTikTok,
      uniqueId: currentUniqueId
    },
    stats: {
      totalLikes,
      likeProgress: likeBuffer,
      cleanseThreshold: CLEANSE_LIKE_THRESHOLD,
      cleanseCount
    },
    energy: getGlobalEnergyState("init"),
    queue: questionQueue,
    currentReading: currentSessionReading
  });

  // Cập nhật cấu hình TikTok Live Studio qua Socket
  socket.on("studio:config", (payload = {}, callback) => {
    studioConfig = {
      ...studioConfig,
      ...payload
    };
    restartAutoDrawTimer();
    io.emit("studio:config_updated", studioConfig);
    if (typeof callback === "function") callback({ ok: true, studioConfig });
  });

  // Phát giọng nói Cô Phù Thủy theo yêu cầu từ Admin
  socket.on("tts:speak", (payload = {}) => {
    io.emit("tts:play", {
      text:
        payload.text ||
        "Xin chào các tâm hồn hữu duyên. Hãy thả tim thanh tẩy bộ bài và gửi câu hỏi để mình rút bài giải mã thông điệp vũ trụ dành riêng cho bạn nhé."
    });
  });

  // Đổi chủ đề phiên Live qua Socket
  socket.on("topic:change", (payload = {}, callback) => {
    if (payload.topic) {
      currentTopic = String(payload.topic).trim();
      io.emit("topic:updated", { topic: currentTopic, timestamp: new Date().toISOString() });
    }
    if (typeof callback === "function") callback({ ok: true, topic: currentTopic });
  });

  // 1. Kết nối / Ngắt kết nối TikTok Live qua Socket
  socket.on("tiktok:connect", async (payload = {}, callback) => {
    try {
      const status = await connectToTikTokLive(payload.uniqueId, {
        signApiKey: payload.signApiKey,
        sessionId: payload.sessionId
      });
      if (typeof callback === "function") callback({ ok: true, ...status });
    } catch (error) {
      const errorMsg = error.message || "Lỗi kết nối TikTok Live";
      socket.emit("tiktok:status", {
        status: "error",
        uniqueId: payload.uniqueId,
        message: errorMsg
      });
      if (typeof callback === "function") callback({ ok: false, error: errorMsg });
    }
  });

  socket.on("tiktok:disconnect", (_, callback) => {
    const status = disconnectFromTikTokLive();
    if (typeof callback === "function") callback({ ok: true, ...status });
  });

  // Nhận thông báo từ OBS Overlay khi giọng đọc AI đã đọc xong lời giải bài
  socket.on("reading:finished", (payload = {}) => {
    handleReadingFinished(payload?.readingId);
  });

  // 2. Quản lý hàng chờ câu hỏi (Lấy người tiếp theo để bốc bài, xóa hàng chờ)
  socket.on("queue:next", (payload = {}, callback) => {
    if (questionQueue.length === 0) {
      if (typeof callback === "function") {
        callback({ ok: false, error: "Hàng chờ câu hỏi hiện đang trống." });
      }
      return;
    }

    const reading = processNextQueueItem(true);
    if (typeof callback === "function") callback({ ok: true, reading });
  });

  socket.on("queue:remove", ({ queueId } = {}) => {
    questionQueue = questionQueue.filter((item) => item.queueId !== queueId);
    io.emit("queue:updated", questionQueue);
  });

  socket.on("queue:clear", () => {
    questionQueue = [];
    currentReadingState = "idle";
    currentActiveReadingId = null;
    if (readingSafetyTimer) {
      clearTimeout(readingSafetyTimer);
      readingSafetyTimer = null;
    }
    if (readingNextDelayTimer) {
      clearTimeout(readingNextDelayTimer);
      readingNextDelayTimer = null;
    }
    io.emit("queue:updated", questionQueue);
  });

  // 3. Sự kiện Mock trực tiếp qua Socket.io dành cho Admin Panel
  socket.on("mock:chat", (data = {}) => {
    const isMock = data.isMock !== undefined ? Boolean(data.isMock) : true;
    handleChatEvent({
      uniqueId: data.uniqueId || (isMock ? "viewer_mock" : "real_live_viewer"),
      nickname: data.nickname || (isMock ? "Khách Chim Mồi 🌸" : "Khách Live Thật 🔴"),
      comment: data.comment || "Minh - 15/08/2000",
      profilePictureUrl: data.profilePictureUrl || "",
      isMock
    }, isMock);
  });

  socket.on("mock:like", (data = {}) => {
    handleLikeEvent({
      uniqueId: data.uniqueId || "liker_mock",
      nickname: data.nickname || "Người Thả Tim ❤️",
      likeCount: Number(data.likeCount) || 50
    });
  });

  socket.on("mock:gift", (data = {}) => {
    handleGiftEvent({
      uniqueId: data.uniqueId || "gifter_mock",
      nickname: data.nickname || "Nhà Tài Trợ Vàng 💎",
      giftName: data.giftName || (Number(data.diamondCount) >= 10 ? "Vương Miện Huyền Bí" : "Hoa Hồng"),
      diamondCount: Number(data.diamondCount) || 1,
      repeatCount: Number(data.repeatCount) || 1,
      giftType: 0,
      repeatEnd: true,
      question: data.question || ""
    });
  });

  socket.on("mock:draw", (data = {}) => {
    enqueueQuestion({
      uniqueId: data.uniqueId || "manual_reader",
      nickname: data.nickname || "Khách Hữu Duyên",
      question: data.question || "Xin thông điệp Tarot",
      cardCount: Number(data.cardCount) === 3 ? 3 : 1,
      isMock: true
    });
    if (currentReadingState === "idle") {
      processNextQueueItem();
    }
  });

  socket.on("mock:cleanse", (data = {}) => {
    cleanseCount += 1;
    io.emit("tarot:cleanse", {
      cleanseId: `cleanse_${Date.now()}_${cleanseCount}`,
      cleanseCount,
      triggeredBy: data.nickname || "Tarot Reader",
      totalLikes,
      message: "✨ Năng lượng bộ bài đã được làm mới hoàn toàn!",
      timestamp: new Date().toISOString()
    });
  });

  // 4. Mock Bói Ghép Đôi (Love Compatibility Radar)
  socket.on("mock:lovematch", (data = {}) => {
    enqueueQuestion({
      uniqueId: data.uniqueId || "cap_doi_99",
      nickname: data.nickname || "Cặp Đôi Hữu Duyên 💕",
      question: `#tinhyeu "${data.personA || "Nam 2002"}" "${data.personB || "Nữ 2004"}"`,
      isLoveMatch: true,
      loveMatchData: {
        personA: data.personA || "Nam 2002",
        personB: data.personB || "Nữ 2004"
      },
      displayLabel: `${data.personA || "Nam 2002"} ❤️ ${data.personB || "Nữ 2004"}`,
      isMock: true
    });
    if (currentReadingState === "idle") {
      processNextQueueItem();
    }
  });

  // 5. Mock VIP BẬT ĐÈN (Fast-Pass Mạ Vàng 50+ xu / Nước hoa / Mũ miện)
  socket.on("mock:vip_fastpass", (data = {}) => {
    handleGiftEvent({
      uniqueId: data.uniqueId || "vip_king_999",
      nickname: data.nickname || "Đại Gia Mạ Vàng 👑",
      giftName: data.giftName || "Mũ Miện Hoàng Gia 👑",
      diamondCount: Number(data.diamondCount) || 99,
      repeatCount: 1,
      giftType: 0,
      repeatEnd: true,
      forceFastPass: true,
      question: data.question || "Xin trải bài VIP Đặc Quyền: Tình duyên & Tài lộc tháng này!"
    });
  });

  // 6. Mock Cộng Năng Lượng Tập Thể (+500 Tim & +5 Share)
  socket.on("mock:energy_boost", (data = {}) => {
    const addLikes = Number(data.likeCount) || 500;
    const addShares = Number(data.shareCount) || 5;
    totalLikes += addLikes;
    globalEnergyLikes += addLikes;
    totalShares += addShares;
    globalEnergyShares += addShares;

    const energyState = getGlobalEnergyState("boost");
    io.emit("energy:update", energyState);

    if (energyState.percent >= 100) {
      triggerGlobalMysterySpread({
        triggeredBy: data.nickname || "Khán Giả Phòng Live",
        triggerSource: "boost"
      });
    }
  });

  // 7. Mock Đầy Cây Năng Lượng Tập Thể (5.000 Tim / 50 Share -> Nổ Sao Băng & Bốc Tụ Bài Bí Ẩn Chung)
  socket.on("mock:energy_unlock", (data = {}) => {
    totalLikes += GLOBAL_ENERGY_LIKE_TARGET;
    totalShares += GLOBAL_ENERGY_SHARE_TARGET;
    triggerGlobalMysterySpread({
      triggeredBy: data.nickname || "Toàn Thể Phòng Live",
      triggerSource: "admin_unlock"
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client đã ngắt kết nối: ${socket.id}`);
  });
});

// ==================== KHỞI ĐỘNG SERVER ====================

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log("============================================================");
    console.log(`✅ SERVER TAROT ĐÃ ĐANG CHẠY SẴN TẠI CỔNG ${PORT}!`);
    console.log(`👉 Mở trang Admin   : http://localhost:${PORT}/admin`);
    console.log(`👉 Mở trang Overlay : http://localhost:${PORT}/overlay.html`);
    console.log("============================================================");
    process.exit(0);
  } else {
    console.error("Lỗi khởi động Server:", err);
  }
});

server.listen(PORT, () => {
  console.log("============================================================");
  console.log(`🔮 TAROT TIKTOK LIVE OVERLAY SERVER ĐANG CHẠY TẠI CỔNG ${PORT}`);
  console.log(`👉 Trang điều khiển Admin      : http://localhost:${PORT}/admin`);
  console.log(`👉 Màn hình OBS / Live Studio  : http://localhost:${PORT}/overlay.html`);
  console.log(`👉 Tổng số lá bài Tarot RWS    : ${TAROT_DATA.length} lá`);
  console.log("============================================================");

  // Tự động mở trình duyệt tới trang Admin trên Windows
  if (process.platform === "win32") {
    setTimeout(() => {
      try {
        exec(`start http://localhost:${PORT}/admin`);
      } catch (_) {}
    }, 1200);
  }
});
