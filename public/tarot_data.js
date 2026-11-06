/**
 * Bộ cơ sở dữ liệu 78 lá bài Tarot chuẩn Rider-Waite-Smith (22 Major Arcana & 56 Minor Arcana)
 * Dùng chung cho cả Frontend (Browser Overlay/Admin) và Backend (Node.js)
 */
const TAROT_DATA = [
  // ==================== MAJOR ARCANA (22 LÁ) ====================
  {
    id: 0,
    name: "The Fool - Kẻ Khờ",
    arcana: "Major",
    keywords: ["Khởi đầu mới", "Tự do", "Liều lĩnh"],
    love: "Một mối quan hệ mới mẻ, hồn nhiên và đầy bất ngờ sắp gõ cửa trái tim bạn.",
    career: "Thời điểm vàng để bước ra khỏi vùng an toàn và thử sức với dự án hoặc hướng đi mới.",
    advice: "Hãy tin tưởng vào hành trình phía trước và dũng cảm bước đi bằng trái tim rộng mở!"
  },
  {
    id: 1,
    name: "The Magician - Nhà Ảo Thuật",
    arcana: "Major",
    keywords: ["Kỹ năng", "Sáng tạo", "Chủ động"],
    love: "Sự thu hút mạnh mẽ và giao tiếp khéo léo giúp bạn làm chủ hoàn toàn chuyện tình cảm.",
    career: "Bạn đã có đủ mọi nguồn lực trong tay để biến ý tưởng táo bạo thành kết quả thực tế.",
    advice: "Vũ trụ đã trao đủ công cụ cho bạn, hãy hành động ngay lập tức để kiến tạo thực tại!"
  },
  {
    id: 2,
    name: "The High Priestess - Nữ Tư Tế",
    arcana: "Major",
    keywords: ["Trực giác", "Bí ẩn", "Tiềm thức"],
    love: "Tình cảm ẩn chứa nhiều cảm xúc sâu lắng chưa nói thành lời, cần lắng nghe bằng trái tim.",
    career: "Đừng vội tiết lộ kế hoạch; hãy quan sát kỹ lưỡng và tin vào linh cảm nhạy bén của mình.",
    advice: "Câu trả lời bạn tìm kiếm không nằm ở bên ngoài mà đang ngân vang trong chính trực giác của bạn."
  },
  {
    id: 3,
    name: "The Empress - Nữ Hoàng",
    arcana: "Major",
    keywords: ["Trù phú", "Nuôi dưỡng", "Quyến rũ"],
    love: "Tình yêu đơm hoa kết trái ngọt ngào, tràn ngập sự quan tâm, ấm áp và gắn kết bền chặt.",
    career: "Tài lộc dồi dào, các dự án sáng tạo phát triển thuận lợi và mang lại thành quả sung túc.",
    advice: "Hãy yêu thương bản thân và mở lòng đón nhận sự trù phú mà vũ trụ đang ban tặng."
  },
  {
    id: 4,
    name: "The Emperor - Hoàng Đế",
    arcana: "Major",
    keywords: ["Quyền lực", "Kỷ luật", "Vững chãi"],
    love: "Mối quan hệ mang tính cam kết lâu dài, có chỗ dựa vững chắc nhưng đôi lúc hơi khô khan.",
    career: "Sự quyết đoán, kỷ luật thép và tư duy tổ chức sẽ đưa bạn lên vị trí dẫn đầu.",
    advice: "Giữ vững lập trường, làm chủ cảm xúc và xây dựng nền tảng cuộc sống thật kiên cố."
  },
  {
    id: 5,
    name: "The Hierophant - Giáo Hoàng",
    arcana: "Major",
    keywords: ["Truyền thống", "Chuẩn mực", "Minh sư"],
    love: "Chuyện tình cảm hướng tới sự nghiêm túc, được gia đình ủng hộ hoặc tiến tới hôn nhân.",
    career: "Làm việc theo quy trình chuẩn mực hoặc học hỏi từ người đi trước sẽ mang lại thành công.",
    advice: "Hãy tôn trọng những giá trị cốt lõi bền vững và tìm kiếm lời khuyên từ người có kinh nghiệm."
  },
  {
    id: 6,
    name: "The Lovers - Tình Nhân",
    arcana: "Major",
    keywords: ["Tình yêu", "Sự hòa hợp", "Lựa chọn"],
    love: "Sự đồng điệu tuyệt vời giữa hai tâm hồn, tình yêu thăng hoa rực rỡ và nồng nhiệt.",
    career: "Cơ hội hợp tác đắt giá xuất hiện, nhưng bạn cần đưa ra quyết định dứt khoát từ trái tim.",
    advice: "Hãy lựa chọn điều khiến tâm hồn bạn rung động thật sự và chịu trách nhiệm với quyết định đó."
  },
  {
    id: 7,
    name: "The Chariot - Cỗ Xe",
    arcana: "Major",
    keywords: ["Ý chí", "Chiến thắng", "Tốc độ"],
    love: "Hãy chủ động tiến tới chinh phục người thương và vượt qua mọi khoảng cách địa lý hay rào cản.",
    career: "Tập trung cao độ và quyết tâm sắt đá sẽ giúp bạn bứt tốc vượt mặt mọi đối thủ.",
    advice: "Nắm chặt dây cương cuộc đời mình, tiến thẳng về phía trước và không gì có thể cản bước bạn!"
  },
  {
    id: 8,
    name: "Strength - Sức Mạnh",
    arcana: "Major",
    keywords: ["Bản lĩnh", "Kiên nhẫn", "Bao dung"],
    love: "Sự dịu dàng, nhẫn nại và thấu hiểu sẽ cảm hóa được mọi hiểu lầm hay nóng nảy của đối phương.",
    career: "Bình tĩnh kiểm soát áp lực bằng nội lực mềm mỏng nhưng kiên cường sẽ giúp bạn chuyển bại thành thắng.",
    advice: "Sức mạnh vĩ đại nhất không nằm ở sự cưỡng ép mà ở lòng kiên nhẫn và trái tim dũng cảm."
  },
  {
    id: 9,
    name: "The Hermit - Ẩn Sĩ",
    arcana: "Major",
    keywords: ["Chiêm nghiệm", "Tĩnh lặng", "Soi sáng"],
    love: "Cần một khoảng lặng riêng tư để hiểu rõ lòng mình trước khi đòi hỏi sự thấu hiểu từ người khác.",
    career: "Tạm lùi lại để nghiên cứu chuyên sâu và hoàn thiện kỹ năng sẽ mở ra hướng đi đột phá.",
    advice: "Tạm rời xa ồn ào bên ngoài, ngọn đèn trí tuệ chỉ bừng sáng khi tâm bạn thực sự tĩnh lặng."
  },
  {
    id: 10,
    name: "Wheel of Fortune - Bánh Xe Số Phận",
    arcana: "Major",
    keywords: ["Vận may", "Bước ngoặt", "Nhân quả"],
    love: "Một cuộc gặp gỡ định mệnh hoặc sự chuyển biến bất ngờ sẽ làm thay đổi hoàn toàn cục diện tình cảm.",
    career: "Vận hội mới đang xoay chuyển theo chiều hướng tích cực, hãy nhạy bén nắm bắt thời cơ.",
    advice: "Mọi thứ đều vận động không ngừng; hãy mỉm cười đón nhận bước ngoặt mới của số phận!"
  },
  {
    id: 11,
    name: "Justice - Công Lý",
    arcana: "Major",
    keywords: ["Công bằng", "Sự thật", "Trách nhiệm"],
    love: "Sự sòng phẳng, rõ ràng và chân thành là chìa khóa duy nhất để giữ gìn sự cân bằng trong tình yêu.",
    career: "Mọi nỗ lực của bạn sẽ được đền đáp xứng đáng; các thủ tục giấy tờ hoặc pháp lý sẽ được giải quyết minh bạch.",
    advice: "Hãy sống ngay thẳng, trung thực với chính mình vì cán cân vũ trụ luôn tuyệt đối công bằng."
  },
  {
    id: 12,
    name: "The Hanged Man - Người Treo",
    arcana: "Major",
    keywords: ["Hy sinh", "Góc nhìn mới", "Tạm dừng"],
    love: "Đừng cố thúc ép mối quan hệ lúc này; hãy lùi lại và đặt mình vào vị trí của người ấy.",
    career: "Chấp nhận chậm lại một nhịp hoặc buông bỏ lợi ích ngắn hạn để đổi lấy tầm nhìn đột phá hơn.",
    advice: "Khi bế tắc, hãy đổi góc nhìn ngược lại—sự buông xả đúng lúc sẽ mở ra cánh cửa giải thoát."
  },
  {
    id: 13,
    name: "Death - Tử Thần",
    arcana: "Major",
    keywords: ["Kết thúc", "Tái sinh", "Chuyển hóa"],
    love: "Khép lại những tổn thương cũ hoặc một giai đoạn lỗi thời để tình cảm được tái sinh mạnh mẽ hơn.",
    career: "Chấm dứt công việc hoặc dự án không còn phù hợp là bước đệm tất yếu cho một khởi đầu rực rỡ.",
    advice: "Đừng sợ hãi sự kết thúc; cánh cửa cũ phải đóng lại thì bình minh mới mới có thể rạng ngời."
  },
  {
    id: 14,
    name: "Temperance - Tiết Độ",
    arcana: "Major",
    keywords: ["Cân bằng", "Chữa lành", "Hài hòa"],
    love: "Tình yêu êm đềm, hai bên biết dung hòa cá tính của nhau để cùng chữa lành và đồng hành lâu dài.",
    career: "Sự phối hợp nhịp nhàng và điều tiết hợp lý giữa công việc và nghỉ ngơi đem lại hiệu suất bền vững.",
    advice: "Giữ tâm thế điềm tĩnh và dung hòa mọi thái cực, sự bình yên sẽ dẫn lối tới thành công."
  },
  {
    id: 15,
    name: "The Devil - Ác Quỷ",
    arcana: "Major",
    keywords: ["Cám dỗ", "Ràng buộc", "Đam mê"],
    love: "Sức hút thể xác mãnh liệt nhưng coi chừng sự phụ thuộc cảm xúc, ghen tuông hoặc mối quan hệ độc hại.",
    career: "Cẩn trọng trước những món lợi nhanh đầy rủi ro hoặc tình trạng bán sức khỏe vì tham vọng quá mức.",
    advice: "Sợi xích trói buộc bạn thực chất rất lỏng lẻo, hãy dứt khoát bước ra khỏi bóng tối của sự lệ thuộc!"
  },
  {
    id: 16,
    name: "The Tower - Tòa Tháp",
    arcana: "Major",
    keywords: ["Sụp đổ", "Thức tỉnh", "Giải phóng"],
    love: "Một sự thật phơi bày làm lung lay những ảo tưởng cũ, giúp bạn nhìn rõ bản chất thật của mối quan hệ.",
    career: "Biến cố bất ngờ buộc bạn phải đập bỏ kế hoạch lỗi thời để xây dựng lại trên nền tảng vững chắc hơn.",
    advice: "Những gì giả tạo sụp đổ là để giải phóng bạn; hãy can đảm đón nhận sự thật và làm lại từ đầu!"
  },
  {
    id: 17,
    name: "The Star - Ngôi Sao",
    arcana: "Major",
    keywords: ["Hy vọng", "Cảm hứng", "Bình yên"],
    love: "Trái tim bạn được xoa dịu ấm áp, mở ra giai đoạn yêu thương trong sáng, chân thành và đầy hy vọng.",
    career: "Nguồn cảm hứng sáng tạo dồi dào và danh tiếng tốt đẹp giúp con đường sự nghiệp rộng mở thênh thang.",
    advice: "Sau cơn bão lớn, bầu trời sao đang tỏa sáng rực rỡ vì bạn—hãy giữ trọn niềm tin vào phép màu!"
  },
  {
    id: 18,
    name: "The Moon - Mặt Trăng",
    arcana: "Major",
    keywords: ["Ảo giác", "Hoang mang", "Bí mật"],
    love: "Có những hiểu lầm, nghi ngờ hoặc tâm tư giấu kín khiến bạn bất an; đừng để nỗi sợ dẫn dắt.",
    career: "Thông tin hiện tại chưa rõ ràng, hãy kiểm chứng kỹ lưỡng trước khi ký kết hay đầu tư tiền bạc.",
    advice: "Đừng để bóng tối của nỗi sợ đánh lừa; hãy kiên nhẫn đợi sương mù tan để thấy rõ sự thật."
  },
  {
    id: 19,
    name: "The Sun - Mặt Trời",
    arcana: "Major",
    keywords: ["Rực rỡ", "Thành công", "Hạnh phúc"],
    love: "Tình yêu ngập tràn tiếng cười, sự ấm áp, minh bạch và niềm hạnh phúc viên mãn trọn vẹn.",
    career: "Thành công vang dội, tài chính khởi sắc rực rỡ và mọi công sức của bạn đều được vinh danh.",
    advice: "Hãy tỏa sáng hết mình với năng lượng tích cực nhất, thành quả ngọt ngào đã thuộc về bạn!"
  },
  {
    id: 20,
    name: "Judgement - Phán Quyết",
    arcana: "Major",
    keywords: ["Thức tỉnh", "Tiếng gọi", "Tha thứ"],
    love: "Cơ hội làm mới lại tình cảm hoặc tha thứ cho quá khứ để bước sang trang mới trưởng thành hơn.",
    career: "Thời khắc đánh giá lại toàn bộ hành trình và đón nhận bước thăng tiến mang tính sứ mệnh.",
    advice: "Hãy tha thứ cho những sai lầm đã qua và sẵn sàng đáp lại tiếng gọi thiêng liêng của tâm hồn!"
  },
  {
    id: 21,
    name: "The World - Thế Giới",
    arcana: "Major",
    keywords: ["Viên mãn", "Hoàn thành", "Trọn vẹn"],
    love: "Mối quan hệ đạt đến cái kết viên mãn, bền chặt hoặc cùng nhau bước sang một chương lớn của cuộc đời.",
    career: "Dự án hoàn thành xuất sắc mỹ mãn, mở ra cơ hội vươn tầm quốc tế hoặc đạt đỉnh cao mục tiêu.",
    advice: "Chúc mừng bạn đã khép lại một hành trình trọn vẹn, hãy tận hưởng vinh quang và đón chờ chân trời mới!"
  },

  // ==================== MINOR ARCANA: WANDS - BỘ GẬY (14 LÁ) ====================
  {
    id: 22,
    name: "Ace of Wands - Át Gậy",
    arcana: "Minor",
    keywords: ["Nhiệt huyết", "Ý tưởng mới", "Bùng nổ"],
    love: "Ngọn lửa cảm xúc bùng cháy mãnh liệt, mang đến sự cuốn hút tức thì và đầy đam mê.",
    career: "Cơ hội kinh doanh hoặc dự án sáng tạo đầy tiềm năng vừa xuất hiện, hứa hẹn đà tăng trưởng mạnh.",
    advice: "Chớp lấy ngọn lửa cảm hứng ngay lúc này và bắt tay vào hành động không chần chừ!"
  },
  {
    id: 23,
    name: "Two of Wands - 2 Gậy",
    arcana: "Minor",
    keywords: ["Tầm nhìn", "Hoạch định", "Mở rộng"],
    love: "Hai bạn đang cùng nhau bàn bạc và lên kế hoạch nghiêm túc cho tương lai xa hơn.",
    career: "Đã đến lúc mở rộng quy mô công việc và vươn ra những thị trường hoặc lĩnh vực mới mẻ.",
    advice: "Thế giới rộng lớn đang nằm trong tầm mắt bạn, hãy mạnh dạn bước ra khỏi giới hạn quen thuộc."
  },
  {
    id: 24,
    name: "Three of Wands - 3 Gậy",
    arcana: "Minor",
    keywords: ["Triển vọng", "Vươn xa", "Đón thành quả"],
    love: "Tình cảm tiến triển vững vàng, những kỳ vọng của bạn về đối phương đang dần trở thành hiện thực.",
    career: "Những con tàu đầu tư của bạn đang cập bến, mở ra cơ hội hợp tác xa hoặc phát triển thuận lợi.",
    advice: "Nỗ lực ban đầu đã đi đúng hướng, hãy giữ tầm nhìn xa và tự tin đón nhận kết quả tốt đẹp."
  },
  {
    id: 25,
    name: "Four of Wands - 4 Gậy",
    arcana: "Minor",
    keywords: ["Ăn mừng", "Đoàn tụ", "Ổn định"],
    love: "Tình yêu ngập tràn niềm vui lễ hội, báo hiệu tin vui về đám cưới, kỷ niệm đẹp hoặc về chung một nhà.",
    career: "Hoàn thành cột mốc quan trọng với sự ghi nhận nồng nhiệt từ đồng nghiệp và tập thể.",
    advice: "Hãy tận hưởng trọn vẹn niềm vui sum vầy và tự hào về mái ấm vững chắc bạn đã dựng xây."
  },
  {
    id: 26,
    name: "Five of Wands - 5 Gậy",
    arcana: "Minor",
    keywords: ["Cạnh tranh", "Tranh luận", "Va chạm"],
    love: "Những bất đồng quan điểm nhỏ nhặt dễ gây cãi vã nếu cả hai đều muốn giành phần thắng về mình.",
    career: "Môi trường làm việc có sự cạnh tranh gay gắt, đòi hỏi bạn phải bản lĩnh để chứng tỏ năng lực.",
    advice: "Biến áp lực cạnh tranh thành động lực phát triển thay vì tiêu hao năng lượng vào tranh cãi vô bổ."
  },
  {
    id: 27,
    name: "Six of Wands - 6 Gậy",
    arcana: "Minor",
    keywords: ["Vinh quang", "Công nhận", "Tự hào"],
    love: "Bạn trở nên vô cùng thu hút và nhận được sự ngưỡng mộ, trân trọng đặc biệt từ người thương.",
    career: "Chiến thắng vẻ vang, được cấp trên khen thưởng hoặc đạt danh hiệu xứng đáng với công sức bỏ ra.",
    advice: "Hãy ngẩng cao đầu đón nhận hào quang chiến thắng nhưng vẫn giữ trái tim khiêm nhường."
  },
  {
    id: 28,
    name: "Seven of Wands - 7 Gậy",
    arcana: "Minor",
    keywords: ["Phòng thủ", "Kiên định", "Bền bỉ"],
    love: "Hãy kiên quyết bảo vệ tình yêu của mình trước những lời bàn tán hay tác động từ người ngoài.",
    career: "Dù gặp nhiều sức ép cạnh tranh, bạn vẫn đang nắm giữ lợi thế nếu kiên trì giữ vững vị trí.",
    advice: "Đừng lùi bước trước áp lực số đông; lập trường vững vàng sẽ giúp bạn bảo toàn chiến thắng!"
  },
  {
    id: 29,
    name: "Eight of Wands - 8 Gậy",
    arcana: "Minor",
    keywords: ["Thần tốc", "Tin tức", "Chuyển động"],
    love: "Tin nhắn tỏ tình bất ngờ hoặc mối quan hệ tiến triển nhanh như vũ bão đầy phấn khích.",
    career: "Mọi việc hanh thông, tiến độ dự án tăng tốc vượt bậc và tin vui tài chính đến dồn dập.",
    advice: "Thời cơ đang lao tới rất nhanh, hãy phản ứng nhạy bén và xuôi theo dòng chảy năng lượng!"
  },
  {
    id: 30,
    name: "Nine of Wands - 9 Gậy",
    arcana: "Minor",
    keywords: ["Kiên cường", "Cảnh giác", "Chặng cuối"],
    love: "Những tổn thương cũ khiến bạn còn dè dặt, nhưng đừng bỏ cuộc khi hạnh phúc đã ở rất gần.",
    career: "Dù thấm mệt sau chặng đường dài, chỉ cần cố gắng thêm một chút nữa là bạn sẽ chạm đích.",
    advice: "Bạn mạnh mẽ hơn mình nghĩ rất nhiều; hãy trụ vững ở thử thách cuối cùng này!"
  },
  {
    id: 31,
    name: "Ten of Wands - 10 Gậy",
    arcana: "Minor",
    keywords: ["Quá tải", "Gánh nặng", "Ôm đồm"],
    love: "Đừng tự mình gánh vác mọi trách nhiệm trong mối quan hệ, hãy mở lời chia sẻ cùng đối phương.",
    career: "Khối lượng công việc quá lớn đang vắt kiệt sức lực, bạn cần phân quyền và sắp xếp lại ưu tiên.",
    advice: "Học cách buông bớt những gánh nặng không thuộc về mình để bước đi nhẹ nhàng hơn."
  },
  {
    id: 32,
    name: "Page of Wands - Tiểu Đồng Gậy",
    arcana: "Minor",
    keywords: ["Khám phá", "Hào hứng", "Tin vui"],
    love: "Một làn gió tươi mới, trẻ trung và những lời tán tỉnh đáng yêu làm trái tim bạn rộn ràng.",
    career: "Cơ hội học hỏi kỹ năng mới hoặc bắt đầu một dự án thử nghiệm đầy thú vị đang chờ đón.",
    advice: "Giữ trọn sự tò mò nhiệt huyết của tuổi trẻ và sẵn sàng đón nhận trải nghiệm mới!"
  },
  {
    id: 33,
    name: "Knight of Wands - Hiệp Sĩ Gậy",
    arcana: "Minor",
    keywords: ["Nhiệt thành", "Phiêu lưu", "Táo bạo"],
    love: "Tình cảm nồng cháy, mãnh liệt và cuốn hút nhưng cần thêm sự kiên nhẫn để giữ lửa lâu dài.",
    career: "Hành động quyết liệt, dám nghĩ dám làm giúp bạn nhanh chóng chớp lấy cơ hội vàng.",
    advice: "Hãy tiến lên với ngọn lửa đam mê rực cháy nhưng đừng quên giữ sự tỉnh táo trên đường đua."
  },
  {
    id: 34,
    name: "Queen of Wands - Nữ Hoàng Gậy",
    arcana: "Minor",
    keywords: ["Quyến rũ", "Tự tin", "Truyền lửa"],
    love: "Sự tự tin, độc lập và thần thái rạng rỡ của bạn khiến nửa kia hoàn toàn say đắm.",
    career: "Khả năng truyền cảm hứng và kết nối tuyệt vời giúp bạn dẫn dắt công việc đạt hiệu quả cao.",
    advice: "Hãy tự tin tỏa sáng bằng chính cá tính độc bản và nguồn năng lượng ấm áp của bạn!"
  },
  {
    id: 35,
    name: "King of Wands - Vua Gậy",
    arcana: "Minor",
    keywords: ["Lãnh đạo", "Tầm nhìn lớn", "Quyết đoán"],
    love: "Tình yêu nồng nhiệt, che chở mạnh mẽ và luôn hướng tới những mục tiêu lớn lao cùng nhau.",
    career: "Bản lĩnh thủ lĩnh xuất sắc giúp bạn điều hành dự án lớn và gặt hái thành tựu vang dội.",
    advice: "Hãy dẫn dắt cuộc đời mình bằng tầm nhìn vĩ mô và lòng quả cảm của một nhà vua thực thụ."
  },

  // ==================== MINOR ARCANA: CUPS - BỘ CỐC (14 LÁ) ====================
  {
    id: 36,
    name: "Ace of Cups - Át Cốc",
    arcana: "Minor",
    keywords: ["Tình yêu mới", "Đong đầy", "Hạnh phúc"],
    love: "Trái tim ngập tràn cảm xúc yêu thương thuần khiết; cơ hội bắt đầu mối tình lãng mạn tuyệt đẹp.",
    career: "Công việc mang lại niềm vui tinh thần lớn, các mối quan hệ đồng nghiệp và khách hàng vô cùng tốt đẹp.",
    advice: "Hãy mở rộng cánh cửa trái tim để đón nhận dòng suối yêu thương và phước lành đang tuôn chảy!"
  },
  {
    id: 37,
    name: "Two of Cups - 2 Cốc",
    arcana: "Minor",
    keywords: ["Tâm đầu ý hợp", "Gắn kết", "Tri kỷ"],
    love: "Tình yêu đôi lứa hòa quyện sâu sắc, thấu hiểu và tôn trọng nhau như hai nửa hoàn hảo.",
    career: "Tìm được đối tác ăn ý, ký kết hợp đồng thuận lợi trên tinh thần đôi bên cùng có lợi.",
    advice: "Trân trọng sự kết nối chân thành hiện tại, bởi sự đồng điệu tâm hồn là món quà vô giá."
  },
  {
    id: 38,
    name: "Three of Cups - 3 Cốc",
    arcana: "Minor",
    keywords: ["Sum họp", "Tình bạn", "Tin vui"],
    love: "Chuyện tình cảm nhận được sự chúc phúc từ bạn bè hoặc nảy nở từ những buổi gặp gỡ vui vẻ.",
    career: "Tinh thần làm việc nhóm tuyệt vời, dự án thành công rực rỡ đáng để mở tiệc ăn mừng.",
    advice: "Hãy chia sẻ niềm vui và lan tỏa năng lượng tích cực cùng những người luôn yêu quý bạn!"
  },
  {
    id: 39,
    name: "Four of Cups - 4 Cốc",
    arcana: "Minor",
    keywords: ["Thờ ơ", "Chán nản", "Bỏ lỡ"],
    love: "Vì mải nhìn vào thiếu sót nhỏ hoặc chuyện cũ mà bạn vô tình làm ngơ trước sự quan tâm chân thành.",
    career: "Cảm giác nhàm chán tạm thời khiến bạn chưa nhận ra cơ hội tốt đang được trao ngay trước mắt.",
    advice: "Hãy ngước nhìn lên và mở lòng ra, đừng để sự thờ ơ làm vuột mất món quà quý giá từ vũ trụ."
  },
  {
    id: 40,
    name: "Five of Cups - 5 Cốc",
    arcana: "Minor",
    keywords: ["Nuối tiếc", "Buồn bã", "Chuyển hướng"],
    love: "Đừng mãi đau lòng vì những gì đã đổ vỡ, hãy nhìn lại những yêu thương tốt đẹp vẫn còn ở bên.",
    career: "Một thất thoát nhỏ là bài học kinh nghiệm; bạn vẫn còn nguyên nền tảng vững chắc để gây dựng lại.",
    advice: "Lau khô giọt nước mắt tiếc nuối quá khứ, quay lưng lại bạn sẽ thấy hai chiếc cốc hy vọng vẫn còn đầy!"
  },
  {
    id: 41,
    name: "Six of Cups - 6 Cốc",
    arcana: "Minor",
    keywords: ["Hoài niệm", "Ngọt ngào", "Người cũ"],
    love: "Kỷ niệm ấm áp ùa về, có thể kết nối lại với người quen cũ hoặc tận hưởng tình yêu giản dị, trong trẻo.",
    career: "Phát huy thế mạnh sẵn có từ xưa hoặc hợp tác lại với đồng nghiệp, khách hàng quen sẽ rất thuận lợi.",
    advice: "Trân trọng những ký ức đẹp đẽ và giữ cho tâm hồn mình sự hồn nhiên, thiện lương thuần khiết."
  },
  {
    id: 42,
    name: "Seven of Cups - 7 Cốc",
    arcana: "Minor",
    keywords: ["Mộng tưởng", "Bối rối", "Nhiều lựa chọn"],
    love: "Có nhiều vệ tinh hoặc kỳ vọng lãng mạn, nhưng bạn cần tỉnh táo phân biệt giữa ảo mộng và chân tình.",
    career: "Đứng trước quá nhiều ý tưởng hấp dẫn, hãy chọn một mục tiêu thực tế nhất thay vì ôm đồm viển vông.",
    advice: "Đừng để vẻ hào nhoáng đánh lừa; hãy chọn giá trị chân thật và bắt tay vào làm thực tế!"
  },
  {
    id: 43,
    name: "Eight of Cups - 8 Cốc",
    arcana: "Minor",
    keywords: ["Rời bỏ", "Tìm ý nghĩa", "Buông tay"],
    love: "Can đảm bước ra khỏi một mối quan hệ nhạt nhòa, thiếu chiều sâu để tìm kiếm hạnh phúc đích thực.",
    career: "Rời bỏ vị trí an toàn nhưng không còn giúp bạn phát triển để theo đuổi lý tưởng lớn hơn.",
    advice: "Dũng cảm quay lưng với những điều không còn làm tâm hồn bạn trọn vẹn để vươn tới đỉnh cao mới."
  },
  {
    id: 44,
    name: "Nine of Cups - 9 Cốc",
    arcana: "Minor",
    keywords: ["Ước nguyện", "Mãn nguyện", "Sung túc"],
    love: "Chuyện tình cảm viên mãn đúng như mong ước, bạn cảm thấy hài lòng và tràn ngập niềm vui.",
    career: "Lá bài của điều ước thành sự thật: tài chính dư dả, công việc đạt thành tựu đáng tự hào.",
    advice: "Điều ước của bạn đang trở thành hiện thực, hãy mỉm cười đón nhận với lòng biết ơn sâu sắc!"
  },
  {
    id: 45,
    name: "Ten of Cups - 10 Cốc",
    arcana: "Minor",
    keywords: ["Viên mãn", "Gia đình", "Bình yên"],
    love: "Đỉnh cao của hạnh phúc lứa đôi, báo hiệu mái ấm gia đình hòa thuận, yêu thương bền vững trọn đời.",
    career: "Môi trường làm việc gắn kết như gia đình, sự nghiệp ổn định mang lại cuộc sống sung túc, an vui.",
    advice: "Hạnh phúc đích thực đang hiện hữu ngay bên cạnh những người thân yêu của bạn, hãy trân quý từng phút giây!"
  },
  {
    id: 46,
    name: "Page of Cups - Tiểu Đồng Cốc",
    arcana: "Minor",
    keywords: ["Lời tỏ tình", "Dịu dàng", "Linh cảm"],
    love: "Một tin nhắn ngọt ngào, lời tỏ tình dễ thương hoặc cử chỉ lãng mạn bất ngờ sắp đến với bạn.",
    career: "Ý tưởng nghệ thuật và trực giác nhạy bén giúp bạn tìm ra hướng giải quyết công việc rất sáng tạo.",
    advice: "Hãy lắng nghe tiếng thì thầm của trái tim và đón nhận những cảm xúc trong trẻo nhất!"
  },
  {
    id: 47,
    name: "Knight of Cups - Hiệp Sĩ Cốc",
    arcana: "Minor",
    keywords: ["Lãng mạn", "Hào hoa", "Theo đuổi"],
    love: "Một người tinh tế, ngọt ngào đang tiến đến trao cho bạn sự quan tâm đầy chất thơ và lãng mạn.",
    career: "Lời mời hợp tác hấp dẫn phù hợp với đam mê nghệ thuật hoặc giao tiếp ngoại giao xuất hiện.",
    advice: "Hãy để trái tim dẫn lối nhưng vẫn giữ đôi chân vững vàng trên mặt đất thực tế."
  },
  {
    id: 48,
    name: "Queen of Cups - Nữ Hoàng Cốc",
    arcana: "Minor",
    keywords: ["Thấu cảm", "Dịu hiền", "Trực giác cao"],
    love: "Sự lắng nghe, dịu dàng và bao dung sâu sắc giúp tình yêu của bạn trở thành bến đỗ bình yên.",
    career: "Khả năng nắm bắt tâm lý tinh tế giúp bạn tỏa sáng trong các công việc chăm sóc, tư vấn hoặc sáng tạo.",
    advice: "Hãy chăm sóc khu vườn cảm xúc của chính mình trước khi trao đi yêu thương cho thế giới."
  },
  {
    id: 49,
    name: "King of Cups - Vua Cốc",
    arcana: "Minor",
    keywords: ["Điềm đạm", "Trưởng thành", "Làm chủ cảm xúc"],
    love: "Một chỗ dựa tinh thần chín chắn, yêu thương sâu sắc và luôn bình tĩnh che chở bạn qua mọi sóng gió.",
    career: "Sự điềm tĩnh, khôn ngoan và bản lĩnh ngoại giao giúp bạn hóa giải mọi khủng hoảng một cách êm đẹp.",
    advice: "Giữ trái tim ấm áp nhưng cái đầu thật điềm tĩnh, bạn sẽ làm chủ được mọi cơn sóng cuộc đời."
  },

  // ==================== MINOR ARCANA: SWORDS - BỘ KIẾM (14 LÁ) ====================
  {
    id: 50,
    name: "Ace of Swords - Át Kiếm",
    arcana: "Minor",
    keywords: ["Đột phá", "Sự thật", "Sắc bén"],
    love: "Một cuộc trò chuyện thẳng thắn, rõ ràng sẽ giúp tháo gỡ hoàn toàn mọi khúc mắc bấy lâu nay.",
    career: "Trí tuệ minh mẫn và quyết định dứt khoát mang lại bước đột phá lớn, cắt đứt mọi rắc rối.",
    advice: "Hãy dùng lưỡi kiếm của lý trí và sự thật để mở toang cánh cửa thành công phía trước!"
  },
  {
    id: 51,
    name: "Two of Swords - 2 Kiếm",
    arcana: "Minor",
    keywords: ["Lưỡng lự", "Né tránh", "Giằng co"],
    love: "Đừng tiếp tục khép lòng hay trốn tránh vấn đề; bạn cần tháo băng bịt mắt để đối diện với cảm xúc thật.",
    career: "Đứng giữa ngã ba đường khó xử, việc trì hoãn quyết định chỉ làm bạn thêm căng thẳng.",
    advice: "Can đảm nhìn thẳng vào sự thật và đưa ra lựa chọn, bởi đứng yên mới là điều mệt mỏi nhất."
  },
  {
    id: 52,
    name: "Three of Swords - 3 Kiếm",
    arcana: "Minor",
    keywords: ["Tổn thương", "Sự thật đau lòng", "Giải tỏa"],
    love: "Những lời nói vô tâm hoặc hiểu lầm gây nhói lòng, nhưng đối diện với nỗi buồn là bước đầu để chữa lành.",
    career: "Kế hoạch gặp trục trặc hoặc nhận lời phê bình thẳng thắn giúp bạn nhìn ra lỗ hổng cần sửa chữa ngay.",
    advice: "Cho phép mình được khóc để trút bỏ nỗi đau, vì sau cơn mưa bầu trời sẽ lại trong xanh!"
  },
  {
    id: 53,
    name: "Four of Swords - 4 Kiếm",
    arcana: "Minor",
    keywords: ["Nghỉ ngơi", "Hồi phục", "Tĩnh tâm"],
    love: "Hai bạn cần một khoảng không gian yên tĩnh tạm thời để hạ nhiệt căng thẳng và suy ngẫm thấu đáo.",
    career: "Tạm gác lại áp lực công việc để nạp lại năng lượng, tránh kiệt sức trước khi bước vào trận đánh lớn.",
    advice: "Nghỉ ngơi không phải là dừng lại, mà là bước lùi cần thiết để tái tạo sức mạnh tinh thần!"
  },
  {
    id: 54,
    name: "Five of Swords - 5 Kiếm",
    arcana: "Minor",
    keywords: ["Hơn thua", "Tranh chấp", "Tổn thất"],
    love: "Thắng một cuộc cãi vã nhưng làm tổn thương người mình yêu thì thực chất cả hai đều là người thua cuộc.",
    career: "Tránh xa những cuộc đấu đá nội bộ hoặc cạnh tranh không lành mạnh để bảo toàn uy tín cá nhân.",
    advice: "Biết buông bỏ cái tôi đúng lúc và chọn sự bình yên thay vì cố giành phần thắng bằng mọi giá."
  },
  {
    id: 55,
    name: "Six of Swords - 6 Kiếm",
    arcana: "Minor",
    keywords: ["Vượt sóng", "Chuyển dịch", "Bình yên dần"],
    love: "Giai đoạn sóng gió nhất đã ở phía sau, hai bạn đang cùng nhau chèo thuyền tới vùng nước êm ả hơn.",
    career: "Sự thay đổi môi trường làm việc, đi công tác xa hoặc chuyển hướng phương pháp sẽ giúp giải tỏa bế tắc.",
    advice: "Hãy để lại bão giông sau lưng, con thuyền của bạn đang tiến về bến bờ bình yên rồi!"
  },
  {
    id: 56,
    name: "Seven of Swords - 7 Kiếm",
    arcana: "Minor",
    keywords: ["Mưu lược", "Giấu giếm", "Cẩn trọng"],
    love: "Cần sự minh bạch tuyệt đối trong tình cảm; đừng giữ những bí mật riêng làm rạn nứt lòng tin.",
    career: "Làm việc cần có chiến thuật thông minh, linh hoạt và lưu ý bảo mật ý tưởng, kiểm tra kỹ hợp đồng.",
    advice: "Hãy hành xử khôn ngoan, tỉnh táo nhưng luôn giữ trọn đạo đức và sự chân thật với chính mình."
  },
  {
    id: 57,
    name: "Eight of Swords - 8 Kiếm",
    arcana: "Minor",
    keywords: ["Tự trói buộc", "Bế tắc tâm lý", "Suy diễn"],
    love: "Những nỗi sợ vô hình và suy nghĩ tiêu cực tự tạo đang ngăn cản bạn đón nhận hạnh phúc.",
    career: "Bạn không hề hết cách như mình nghĩ; hãy thoát khỏi tư duy lối mòn để nhìn thấy lối ra rộng mở.",
    advice: "Nhà tù duy nhất đang giam giữ bạn là nỗi sợ trong tâm trí—hãy tháo dây trói và bước ra ngay!"
  },
  {
    id: 58,
    name: "Nine of Swords - 9 Kiếm",
    arcana: "Minor",
    keywords: ["Lo âu", "Mất ngủ", "Áp lực"],
    love: "Đừng tự dằn vặt hay suy diễn quá mức trong đêm khuya, hãy tâm sự thẳng thắn để giải tỏa nỗi lòng.",
    career: "Áp lực công việc khiến bạn căng thẳng quá độ, nhưng thực tế mọi việc không tệ như bạn lo sợ.",
    advice: "Hít một hơi thật sâu và buông bỏ những lo âu vô căn cứ, ánh sáng ban mai sẽ xua tan cơn ác mộng!"
  },
  {
    id: 59,
    name: "Ten of Swords - 10 Kiếm",
    arcana: "Minor",
    keywords: ["Chạm đáy", "Khép lại", "Bình minh mới"],
    love: "Nỗi buồn đã đi đến tận cùng và chấm dứt hoàn toàn, trả lại cho bạn sự tự do để đón nắng mới.",
    career: "Một kế hoạch cũ kết thúc dứt điểm giúp bạn trút bỏ gánh nặng và rảnh tay làm lại hiệu quả hơn.",
    advice: "Khi đã chạm đáy thì hướng duy nhất còn lại là đi lên—hãy đứng dậy đón ánh bình minh đang ló rạng!"
  },
  {
    id: 60,
    name: "Page of Swords - Tiểu Đồng Kiếm",
    arcana: "Minor",
    keywords: ["Nhạy bén", "Tìm hiểu", "Thẳng thắn"],
    love: "Ai đó đang âm thầm theo dõi, tìm hiểu thông tin về bạn hoặc chuẩn bị gửi một tin nhắn thẳng thắn.",
    career: "Tư duy nhanh nhạy, ham học hỏi và khả năng nắm bắt thông tin sắc sảo giúp bạn đi trước một bước.",
    advice: "Giữ đầu óc tỉnh táo, quan sát tinh tường và cẩn trọng trong từng lời nói phát ngôn."
  },
  {
    id: 61,
    name: "Knight of Swords - Hiệp Sĩ Kiếm",
    arcana: "Minor",
    keywords: ["Quyết liệt", "Tốc chiến", "Bộc trực"],
    love: "Sự thẳng thắn và chủ động mạnh mẽ rất tốt, nhưng hãy tiết chế lời nói sắc lạnh để tránh làm đau lòng nhau.",
    career: "Hành động dứt khoát, đánh nhanh thắng nhanh giúp bạn giải quyết gọn gàng mọi mục tiêu khó nhằn.",
    advice: "Lao về phía mục tiêu với tốc độ tối đa nhưng nhớ suy nghĩ kỹ trước khi vung kiếm phát ngôn!"
  },
  {
    id: 62,
    name: "Queen of Swords - Nữ Hoàng Kiếm",
    arcana: "Minor",
    keywords: ["Độc lập", "Sắc sảo", "Rõ ràng"],
    love: "Bạn đề cao sự chân thành, rõ ràng và chỉ mở lòng với người thực sự tôn trọng ranh giới của mình.",
    career: "Khả năng phân tích sắc bén, công tâm và giao tiếp đi thẳng vào trọng tâm giúp bạn xử lý việc cực kỳ hiệu quả.",
    advice: "Hãy dùng trí tuệ sắc sảo để nhìn thấu bản chất vấn đề, đồng thời giữ một trái tim nhân hậu."
  },
  {
    id: 63,
    name: "King of Swords - Vua Kiếm",
    arcana: "Minor",
    keywords: ["Trí tuệ", "Công tâm", "Chiến lược"],
    love: "Mối quan hệ dựa trên sự tôn trọng trí tuệ, định hướng rõ ràng và những lời khuyên vô cùng thực tế.",
    career: "Tư duy chiến lược đỉnh cao, quyết đoán và khách quan giúp bạn làm chủ hoàn toàn bàn cờ sự nghiệp.",
    advice: "Đứng trên mọi cảm xúc nhất thời và giải quyết vấn đề bằng trí tuệ minh triết, công bằng nhất."
  },

  // ==================== MINOR ARCANA: PENTACLES - BỘ TIỀN (14 LÁ) ====================
  {
    id: 64,
    name: "Ace of Pentacles - Át Tiền",
    arcana: "Minor",
    keywords: ["Tài lộc", "Cơ hội vàng", "Thịnh vượng"],
    love: "Khởi đầu một mối quan hệ bền vững, thực tế, mang lại cảm giác an toàn và gắn bó lâu dài.",
    career: "Vận may tài chính gõ cửa: cơ hội tăng thu nhập, nhận dự án béo bở hoặc đầu tư sinh lời chắc chắn.",
    advice: "Hạt giống thịnh vượng đã nằm trong tay bạn, hãy gieo trồng và chăm sóc nó bằng hành động thực tế!"
  },
  {
    id: 65,
    name: "Two of Pentacles - 2 Tiền",
    arcana: "Minor",
    keywords: ["Linh hoạt", "Cân đối", "Xoay xở"],
    love: "Cần khéo léo sắp xếp thời gian để cân bằng giữa bộn bề công việc và sự quan tâm dành cho người thương.",
    career: "Khả năng xoay xở dòng tiền và xử lý nhiều đầu việc cùng lúc một cách nhịp nhàng, uyển chuyển.",
    advice: "Giữ nhịp điệu linh hoạt và quản lý tốt thời gian, bạn sẽ làm chủ được mọi biến động!"
  },
  {
    id: 66,
    name: "Three of Pentacles - 3 Tiền",
    arcana: "Minor",
    keywords: ["Chuyên môn", "Hợp tác", "Chất lượng"],
    love: "Tình yêu được vun đắp vững chắc khi cả hai cùng chung tay xây dựng mục tiêu và lắng nghe nhau.",
    career: "Tay nghề chuyên môn cao và sự phối hợp ăn ý cùng đội nhóm giúp dự án đạt chất lượng xuất sắc.",
    advice: "Hãy trau dồi kỹ năng đến mức tinh thông và trân trọng sức mạnh của sự hợp tác tập thể."
  },
  {
    id: 67,
    name: "Four of Pentacles - 4 Tiền",
    arcana: "Minor",
    keywords: ["An toàn", "Tiết kiệm", "Giữ chặt"],
    love: "Yêu thương cần sự tự do tin tưởng; đừng vì sợ mất mát mà kiểm soát hay khép kín cảm xúc quá mức.",
    career: "Tài chính ổn định vững vàng nhờ quản lý chi tiêu chặt chẽ, nhưng đừng quá ngại đầu tư phát triển.",
    advice: "Bảo toàn nguồn lực là tốt, nhưng hãy nhớ dòng chảy thịnh vượng chỉ lưu thông khi biết mở lòng chia sẻ."
  },
  {
    id: 68,
    name: "Five of Pentacles - 5 Tiền",
    arcana: "Minor",
    keywords: ["Thử thách", "Thiếu hụt", "Đồng hành"],
    love: "Giai đoạn khó khăn chính là phép thử chứng minh sự gắn bó đồng cam cộng khổ hoặc cần mở lời sẻ chia.",
    career: "Tài chính hoặc công việc tạm thời chững lại, nhưng sự trợ giúp đang ở ngay gần nếu bạn chịu lên tiếng.",
    advice: "Đừng tự cô lập mình trong giá lạnh; hãy ngước lên nhìn khung cửa sáng đèn và đón nhận sự giúp đỡ!"
  },
  {
    id: 69,
    name: "Six of Pentacles - 6 Tiền",
    arcana: "Minor",
    keywords: ["Cho và nhận", "Hào phóng", "Quý nhân"],
    love: "Mối quan hệ hài hòa khi cả hai cùng biết trao đi sự quan tâm và trân trọng những gì nhận lại.",
    career: "Tài lộc hanh thông, được quý nhân hỗ trợ vốn liếng, tăng lương thưởng hoặc có cơ hội giúp đỡ người khác.",
    advice: "Sự hào phóng và biết ơn sẽ kích hoạt quy luật cân bằng kỳ diệu của dòng chảy tiền bạc."
  },
  {
    id: 70,
    name: "Seven of Pentacles - 7 Tiền",
    arcana: "Minor",
    keywords: ["Kiên nhẫn", "Đầu tư dài hạn", "Đánh giá"],
    love: "Tình cảm bền chặt cần thời gian vun trồng từng ngày, đừng nóng vội đòi hỏi kết quả tức thì.",
    career: "Công sức và tiền bạc bạn đầu tư đang âm thầm nảy mầm, hãy kiên trì chờ ngày thu hoạch lớn.",
    advice: "Hãy kiên nhẫn tin vào quá trình mình đã gieo hạt, quả ngọt xứng đáng nhất luôn cần thời gian chín muồi!"
  },
  {
    id: 71,
    name: "Eight of Pentacles - 8 Tiền",
    arcana: "Minor",
    keywords: ["Chăm chỉ", "Tỉ mỉ", "Rèn luyện"],
    love: "Sự quan tâm chân thành thể hiện qua từng hành động nhỏ nhặt, bền bỉ mỗi ngày dành cho đối phương.",
    career: "Sự tập trung cao độ, rèn giũa kỹ năng chuyên môn không ngừng sẽ mang lại nguồn thu nhập xứng đáng.",
    advice: "Thành công vĩ đại được tạo nên từ sự tận tâm và tỉ mỉ trong từng công việc nhỏ nhất hôm nay!"
  },
  {
    id: 72,
    name: "Nine of Pentacles - 9 Tiền",
    arcana: "Minor",
    keywords: ["Độc lập", "Sang trọng", "Tận hưởng"],
    love: "Bạn tự chủ, quyến rũ và tràn đầy giá trị tự thân, thu hút một tình yêu chất lượng và tôn trọng lẫn nhau.",
    career: "Tự do tài chính, gặt hái thành quả rực rỡ từ chính năng lực cá nhân và tận hưởng cuộc sống đủ đầy.",
    advice: "Hãy tự hào tận hưởng khu vườn thịnh vượng mà chính đôi tay và trí tuệ của bạn đã kiến tạo nên!"
  },
  {
    id: 73,
    name: "Ten of Pentacles - 10 Tiền",
    arcana: "Minor",
    keywords: ["Giàu sang", "Bền vững", "Di sản"],
    love: "Mối quan hệ tiến tới hôn nhân bền vững, được gia đình hậu thuẫn vững chắc cả về tinh thần lẫn vật chất.",
    career: "Đỉnh cao của sự thịnh vượng tài chính, công việc kinh doanh hoặc đầu tư tích lũy phát đạt lâu dài.",
    advice: "Xây dựng những giá trị bền vững hôm nay chính là tạo dựng nền tảng thịnh vượng cho cả tương lai dài lâu!"
  },
  {
    id: 74,
    name: "Page of Pentacles - Tiểu Đồng Tiền",
    arcana: "Minor",
    keywords: ["Cầu tiến", "Học hỏi", "Khởi đầu thực tế"],
    love: "Tình cảm chân thành, mộc mạc và cùng nhau đặt những viên gạch đầu tiên cho mục tiêu tương lai.",
    career: "Tin vui về học tập, thi cử, chứng chỉ mới hoặc một cơ hội kiếm tiền đầy triển vọng vừa mở ra.",
    advice: "Hãy bắt đầu từ những bước đi nhỏ nhưng chắc chắn, sự ham học hỏi sẽ mở ra kho báu tri thức và tài lộc."
  },
  {
    id: 75,
    name: "Knight of Pentacles - Hiệp Sĩ Tiền",
    arcana: "Minor",
    keywords: ["Đáng tin cậy", "Kiên định", "Chắc chắn"],
    love: "Một tình yêu chung thủy, nói ít làm nhiều, luôn âm thầm bảo vệ và mang lại cảm giác an toàn tuyệt đối.",
    career: "Tiến độ công việc đều đặn, kỷ luật và cẩn trọng giúp bạn đạt được mục tiêu tài chính không chút sai sót.",
    advice: "Chậm mà chắc—sự bền bỉ và chữ tín chính là vũ khí mạnh nhất đưa bạn tới thành công!"
  },
  {
    id: 76,
    name: "Queen of Pentacles - Nữ Hoàng Tiền",
    arcana: "Minor",
    keywords: ["Chu đáo", "Sung túc", "Thực tế"],
    love: "Tình yêu ấm áp, chăm sóc chu toàn từ những điều thiết thực nhất trong cuộc sống thường nhật.",
    career: "Quản lý tài chính thông minh, kinh doanh mát tay và tạo ra nguồn thu nhập dồi dào, ổn định.",
    advice: "Hãy chăm sóc tốt cho cơ thể, tài chính và tổ ấm của mình bằng sự khéo léo và trái tim ấm áp."
  },
  {
    id: 77,
    name: "King of Pentacles - Vua Tiền",
    arcana: "Minor",
    keywords: ["Đại gia", "Thành đạt", "Vững vàng"],
    love: "Một bờ vai cực kỳ vững chãi, hào phóng và sẵn sàng bảo bọc, lo lắng trọn vẹn cho tương lai của cả hai.",
    career: "Thành công rực rỡ về tiền bạc, làm chủ doanh nghiệp hoặc nắm giữ vị thế tài chính vô cùng vững mạnh.",
    advice: "Hãy quản trị nguồn lực bằng tầm nhìn thực tế và tận hưởng sự thịnh vượng viên mãn bạn xứng đáng có được!"
  }
];

// Hỗ trợ xuất dữ liệu cho cả môi trường Browser (window) và Node.js (CommonJS)
if (typeof window !== "undefined") {
  window.TAROT_DATA = TAROT_DATA;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TAROT_DATA;
}

