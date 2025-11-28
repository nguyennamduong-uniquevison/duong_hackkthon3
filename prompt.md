Bạn là một senior developer. Bạn giúp tôi một ứng dụng
Overview dự án:
* TechStack: vue3 (tailwind css), hono, postgres, docker, typescript ( sử dụng type định dạng rõ ràng)
* Tổng quan
    - Ứng dụng này cho phép người dùng tạo bộ câu hỏi (quiz set),
    - những người dùng khác có thể tham gia trả lời bộ câu hỏi đó thông qua web. 
    - Kết quả quiz được chấm điểm tự động và hiển thị dưới dạng bảng xếp hạng. 
    - Người dùng cũng có thể đánh giá các bộ quiz.
Thuật ngữ
Quiz set: Một tập hợp nhiều câu hỏi, có tiêu đề, mô tả và danh mục.
Câu hỏi: Một câu hỏi trong một quiz set, gồm các lựa chọn và một đáp án đúng.
Challenge (Lượt thử): Lần một người dùng tham gia trả lời một quiz set.
Score (Điểm): Điểm đạt được trong một lượt thử.
Điểm lần đầu (初回スコア): Điểm đạt được trong lần đầu tiên thử bộ quiz đó.
Trạng thái công khai: Trạng thái “công khai / không công khai” của quiz set.
Yêu cầu chức năng
FR-001: Xác thực người dùng
    Mục đích: Xác định người dùng, quản lý người tạo quiz và người trả lời.
    Tổng quan chức năng:
    Người dùng có thể đăng ký và đăng nhập để tạo hoặc làm quiz. Hệ thống cung cấp sẵn 2 tài khoản test.
1.1 Đăng ký
    Người dùng mới có thể tạo tài khoản.
    Ràng buộc:
    Bắt buộc có tên người dùng, email, mật khẩu
    Email không được trùng lặp
1.2 Đăng nhập
    Người dùng đã đăng ký có thể đăng nhập.
    Ràng buộc:
    Xác thực bằng email và mật khẩu
    Lỗi đăng nhập sẽ hiển thị thông báo
1.3 Đăng xuất
    Người dùng đang đăng nhập có thể đăng xuất.
1.4 Tài khoản test
    Hệ thống có sẵn 2 tài khoản test:
Ràng buộc:
Test 1: test1@example.com, tên: テストユーザー1
Test 2: test2@example.com, tên: テストユーザー2
Mật khẩu chung: password123
Ràng buộc chung cho xác thực:
Người chưa đăng nhập chỉ được xem danh sách quiz công khai
Tạo/chỉnh sửa/xóa quiz hoặc tham gia quiz yêu cầu đăng nhập
FR-002: Quản lý Quiz Set
Mục đích: Người dùng tạo, quản lý và cung cấp nội dung học thông qua quiz.
Tổng quan:
 Người dùng đăng nhập có thể tạo quiz set gồm nhiều câu hỏi. Quiz set có tiêu đề, mô tả, danh mục, trạng thái công khai và thuộc quyền sở hữu người tạo.
2.1 Tạo quiz set
    Ràng buộc:
    Tiêu đề bắt buộc
    Mô tả và danh mục tuỳ chọn
    Lúc tạo có thể chưa có câu hỏi
    Trạng thái ban đầu: không công khai
2.2 Danh sách quiz set
    Mọi người dùng (kể cả chưa đăng nhập) có thể xem danh sách quiz công khai.
    Ràng buộc:
    Hiển thị: tiêu đề, tác giả, danh mục, số câu hỏi, điểm đánh giá trung bình, số người tham gia
    Số người tham gia = số user duy nhất từng làm quiz
    Có thể lọc theo danh mục
    Quiz không công khai không hiển thị (trừ của chính tác giả)
2.3 Chi tiết quiz set
    Mọi người dùng có thể xem chi tiết của quiz công khai.
    Ràng buộc:
    Hiển thị thông tin như: tiêu đề, mô tả, tác giả, danh mục, số câu hỏi, điểm trung bình, số người tham gia, bảng xếp hạng
    Không hiển thị nội dung câu hỏi (chỉ hiển thị khi bắt đầu làm quiz)
    Quiz không công khai chỉ tác giả được xem
2.4 Chỉnh sửa quiz set
 Chỉ tác giả được chỉnh sửa.
2.5 Xóa quiz set
 Chỉ tác giả được xóa.
    Ràng buộc:
    Xóa quiz set sẽ xóa toàn bộ câu hỏi liên quan
    Lịch sử làm quiz vẫn giữ lại
    Xóa mọi đánh giá liên quan
2.6 Công khai / Không công khai
    Tác giả có thể thay đổi trạng thái hiển thị.
    Ràng buộc:
    Chỉ có hai trạng thái: công khai / không công khai
    Quiz không công khai không ai xem hoặc làm được (trừ tác giả)
    Ràng buộc chung:
    Người khác không được sửa/xóa quiz của tác giả
    Người chưa đăng nhập không được tạo/sửa/xóa quiz
FR-003: Quản lý câu hỏi
    Mục đích: Quản lý các câu hỏi thuộc một quiz set.
    Tổng quan:
    Tác giả quiz có thể thêm, sửa, xóa câu hỏi. Mỗi câu hỏi gồm 4 lựa chọn, có 1 đáp án đúng.
    3.1 Thêm câu hỏi
        Ràng buộc:
        Nội dung câu hỏi bắt buộc
        4 lựa chọn bắt buộc
        Bắt buộc chỉ định 1 đáp án đúng
    3.2 Danh sách câu hỏi
        Chỉ tác giả được xem.
    3.3 Chỉnh sửa câu hỏi
        Tác giả có thể thay đổi nội dung, lựa chọn, đáp án.
    3.4 Xóa câu hỏi
        Ràng buộc chung:
        Người không phải tác giả không được chỉnh sửa câu hỏi
        Quiz set có thể tồn tại mà không có câu hỏi nào
FR-004: Làm quiz (Challenge)
    Mục đích: Người dùng làm quiz để học.
    Tổng quan:
    Người dùng đăng nhập có thể tham gia quiz công khai. Sau khi trả lời toàn bộ câu hỏi, hệ thống tự động chấm điểm và lưu kết quả. Phân biệt lần đầu và các lần sau.
    4.1 Bắt đầu challenge
        Ràng buộc:
        Chỉ quiz có ít nhất 1 câu hỏi mới được làm
        Câu hỏi hiển thị tuần tự
        Quiz không công khai chỉ tác giả được làm
    4.2 Trả lời câu hỏi
        Ràng buộc:
        Mỗi câu phải chọn 1 đáp án
        Trả lời hết mới hoàn thành quiz
        4.3 Chấm điểm & hiển thị kết quả
        Ràng buộc:
        Hiển thị số câu đúng / tổng số câu
        Điểm = (số câu đúng / tổng số câu) × 100 (lấy phần nguyên)
        Hiển thị đúng/sai và đáp án đúng cho từng câu
    4.4 Lưu điểm
        Ràng buộc:
        Người dùng có thể làm quiz nhiều lần
        Lưu tất cả điểm
        Điểm lần đầu lưu dưới dạng "初回スコア"
        Các lần sau lưu dưới dạng "通常スコア"
        Ràng buộc chung:
        Người chưa đăng nhập không được làm quiz
        Người tạo quiz cũng có thể làm quiz đó
FR-005: Hiển thị điểm & xếp hạng
    Mục đích: Hiển thị kết quả học tập, tạo động lực cạnh tranh.
    5.1 Điểm của tôi
        Người dùng đăng nhập có thể xem toàn bộ lịch sử làm quiz.
        Ràng buộc:
        Hiển thị: tên quiz, điểm, thời gian làm, loại điểm (lần đầu / bình thường)
        Sắp xếp mới → cũ
    5.2 Bảng xếp hạng theo quiz
        Mọi người dùng có thể xem.
        Ràng buộc:
        Hiển thị trong màn hình chi tiết quiz
        Dựa trên điểm lần đầu của từng người
        Top 10 điểm cao nhất
        Hiển thị tên người dùng và điểm
        Ai chưa làm lần đầu sẽ không vào bảng xếp hạng
        Ràng buộc chung:
        Nếu điểm bằng nhau → ai làm sớm hơn đứng trên
        Quiz chưa có lượt chơi → bảng xếp hạng trống
        Quiz không công khai → chỉ tác giả xem được bảng xếp hạng
FR-006: Chức năng đánh giá (5 sao)
    Mục đích: Người dùng đánh giá chất lượng quiz, hỗ trợ người khác chọn quiz.
    6.1 Đăng đánh giá
        Ràng buộc:
        Mỗi người chỉ được đánh giá 1 lần / 1 quiz
        Điểm từ 1 đến 5
        Người tạo quiz cũng có thể đánh giá
    6.2 Thay đổi đánh giá
        Ràng buộc:
        Chỉ thay đổi đánh giá đã từng gửi
        Điểm vẫn trong khoảng 1 – 5
    6.3 Xóa đánh giá
    6.4 Hiển thị điểm trung bình
        Ràng buộc:
        Hiển thị đến 1 chữ số thập phân
        Nếu chưa có đánh giá → hiển thị “Không có đánh giá”
        Hiển thị tại danh sách và chi tiết quiz
        Ràng buộc chung:
        Người chưa đăng nhập không được đánh giá
        Quiz không công khai chỉ tác giả được đánh giá
        Khi xóa quiz → toàn bộ đánh giá bị xóa

    - chức năng đăng nhập
        - làm validation ở màn hình đăng nhập
        - hiện thị thông báo lỗi khi thông tin không hợp lệ

    -   chức năng đăng ký
    - nút đăng ký ở màn hình đăng nhập
    - làm màn hình đăng ký
    - sau khi đăng ký thì cho phép đăng nhập
    - cho phép đăng ký email, mật khẩu
    - validation email, mật khẩu

    - chức năng tạo quiz Set ở trang ItemsView.vue
    - sau khi đăng nhập tự vào trang này
    - Người dùng đăng nhập có thể tạo quiz set
    - Mỗi quiz set gồm nhiều câu hỏi. 
    - Quiz set có tiêu đề, mô tả, danh mục, trạng thái công khai thuộc quyền sở hữu người tạo.
    - Khi Tạo quiz set gồm (Ràng buộc, Tiêu đề bắt buộc , Mô tả và danh mục tuỳ chọn,  Lúc tạo có thể chưa có câu hỏi, Trạng thái ban đầu: không công khai)
