/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ THỜI GIAN THỰC GOOGLE SHEET & GOOGLE DRIVE
 * Học phần: Lý luận Nhà nước và Pháp luật - Khoa Luật, Học viện PCCC & CNCH
 * =========================================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG:
 * 1. Mở Google Sheets (hoặc tạo 1 Google Trang tính mới).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa toàn bộ nội dung trong file Mã.gs (Code.gs) và dán TOÀN BỘ file code này vào.
 * 4. Nhấn biểu tượng 💾 Lưu dự án (Ctrl + S).
 * 5. Chọn hàm "chayThuNghiem" trong danh sách hàm và nhấn nút "▶️ Chạy" (Run) để kiểm tra.
 *    - Google sẽ yêu cầu "Ủy quyền truy cập" (Authorize access).
 *    - Nhấn chọn tài khoản Google của bạn > Nâng cao (Advanced) > Đi tới dự án (không an toàn) > Cho phép (Allow).
 * 6. Triển khai ứng dụng Web (Deploy):
 *    - Bấm nút "Triển khai" (Deploy) ở góc trên bên phải > "Tùy chọn triển khai mới" (New deployment).
 *    - Nhấp vào biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại" > chọn "Ứng dụng web" (Web app).
 *    - Mô tả: "v1"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> [BẮT BUỘC để web gửi dữ liệu không bị chặn!]
 *    - Nhấn "Triển khai" (Deploy).
 * 7. Sao chép "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec) và dán vào
 *    mục "Google Sync" trong web app của bạn!
 * =========================================================================================
 */

// Tên thư mục Google Drive tự động lưu trữ tài liệu
var DRIVE_FOLDER_NAME = "HOC_LIEU_LY_LUAN_NHA_NUOC_VA_PHAP_LUAT";

/**
 * HÀM KIỂM TRA VÀ KHỞI TẠO HỆ THỐNG
 * (Bấm nút "▶️ Chạy" ở hàm này trong Apps Script để kiểm tra và cấp quyền)
 */
function chayThuNghiem() {
  Logger.log("--- BẮT ĐẦU KIỂM TRA & KHỞI TẠO HỆ THỐNG ---");
  
  var ss = getSpreadsheet();
  if (!ss) {
    Logger.log("❌ Không tìm thấy Google Sheet liên kết! Vui lòng mở Apps Script từ menu Tiện ích mở rộng > Apps Script trong Google Sheet.");
    return;
  }
  
  Logger.log("1. Đang khởi tạo các bảng tính...");
  getOrCreateSheet(ss, "HocVien", [
    "Thời gian đăng ký",
    "Mã sinh viên",
    "Họ và tên",
    "Lớp",
    "Trường",
    "Email",
    "Lần cập nhật cuối"
  ]);

  getOrCreateSheet(ss, "KetQuaKiemTra", [
    "Thời gian làm bài",
    "Mã sinh viên",
    "Họ và tên",
    "Lớp",
    "Trường",
    "Bài kiểm tra",
    "Chương",
    "Điểm số (/10)",
    "Tỷ lệ đúng (%)",
    "Số câu đúng",
    "Số câu sai",
    "Thời gian làm (giây)"
  ]);

  getOrCreateSheet(ss, "BaiNopTuNghienCuu", [
    "Thời gian nộp",
    "Mã sinh viên",
    "Họ và tên",
    "Lớp",
    "Trường",
    "Tên nhiệm vụ",
    "Nội dung bài làm",
    "Tên file đính kèm"
  ]);

  getOrCreateSheet(ss, "LichSuHoatDong", [
    "Thời gian",
    "Mã sinh viên",
    "Họ và tên",
    "Hành động",
    "Chi tiết"
  ]);

  getOrCreateSheet(ss, "TaiLieuGoogleDrive", [
    "Thời gian tải lên",
    "Tên tài liệu",
    "Chương",
    "Định dạng",
    "Drive File ID",
    "Link xem trực tiếp",
    "Link tải về",
    "Người tải lên"
  ]);

  Logger.log("2. Đang kiểm tra / tạo thư mục Google Drive: " + DRIVE_FOLDER_NAME);
  var folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
  Logger.log("✅ Thư mục Google Drive: " + folder.getName() + " (ID: " + folder.getId() + ")");
  
  Logger.log("🎉 CHÚC MỪNG: Hệ thống Google Sheet & Google Drive đã sẵn sàng 100%!");
  Logger.log("Bây giờ bạn hãy bấm nút [Triển khai] (Deploy) > [Tùy chọn triển khai mới] > [Ứng dụng web] > Ai có quyền truy cập: [Bất kỳ ai].");
}

/**
 * Xử lý GET request từ trình duyệt hoặc kiểm tra kết nối
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script API - Lý luận Nhà nước và Pháp luật đang hoạt động sẵn sàng!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý POST request từ ứng dụng React Web
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        error: "Không nhận được nội dung POST. Vui lòng gọi từ ứng dụng web."
      });
    }

    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var action = data.action;
    var ss = getSpreadsheet();
    
    // 1. Kiểm tra kết nối (Ping)
    if (action === "ping") {
      return jsonResponse({
        success: true,
        message: "Kết nối Google Apps Script & Google Sheet thành công!"
      });
    }
    
    // 2. Đồng bộ thông tin học viên khi đăng ký / cập nhật
    if (action === "syncStudent") {
      var sheet = getOrCreateSheet(ss, "HocVien", [
        "Thời gian đăng ký",
        "Mã sinh viên",
        "Họ và tên",
        "Lớp",
        "Trường",
        "Email",
        "Lần cập nhật cuối"
      ]);
      
      var studentId = (data.studentId || "").toString().trim().toUpperCase();
      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][1] && rows[i][1].toString().trim().toUpperCase() === studentId) {
          foundIndex = i + 1;
          break;
        }
      }
      
      var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      
      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 3).setValue(data.displayName);
        sheet.getRange(foundIndex, 4).setValue(data.studentClass);
        sheet.getRange(foundIndex, 5).setValue(data.school);
        sheet.getRange(foundIndex, 6).setValue(data.email || "");
        sheet.getRange(foundIndex, 7).setValue(nowStr);
      } else {
        sheet.appendRow([
          nowStr,
          studentId,
          data.displayName,
          data.studentClass,
          data.school,
          data.email || "",
          nowStr
        ]);
      }
      
      logActivity(ss, studentId, data.displayName, "Đăng ký / Cập nhật thông tin học viên", (data.studentClass || "") + " - " + (data.school || ""));
      return jsonResponse({ success: true, message: "Đã lưu thông tin học viên vào Google Sheet" });
    }
    
    // 3. Đồng bộ kết quả kiểm tra trắc nghiệm
    if (action === "syncQuizAttempt") {
      var quizSheet = getOrCreateSheet(ss, "KetQuaKiemTra", [
        "Thời gian làm bài",
        "Mã sinh viên",
        "Họ và tên",
        "Lớp",
        "Trường",
        "Bài kiểm tra",
        "Chương",
        "Điểm số (/10)",
        "Tỷ lệ đúng (%)",
        "Số câu đúng",
        "Số câu sai",
        "Thời gian làm (giây)"
      ]);
      
      var timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      quizSheet.appendRow([
        timeStr,
        data.studentId,
        data.displayName,
        data.studentClass,
        data.school,
        data.quizTitle,
        data.quizChapter || "",
        data.score,
        data.percentage,
        data.correctCount,
        data.wrongCount,
        data.durationSeconds || 0
      ]);
      
      logActivity(ss, data.studentId, data.displayName, "Làm bài trắc nghiệm", data.quizTitle + " - Điểm: " + data.score + "/10");
      return jsonResponse({ success: true, message: "Đã ghi nhận kết quả kiểm tra vào Google Sheet" });
    }
    
    // 4. Đồng bộ bài làm tự nghiên cứu
    if (action === "syncSubmission") {
      var subSheet = getOrCreateSheet(ss, "BaiNopTuNghienCuu", [
        "Thời gian nộp",
        "Mã sinh viên",
        "Họ và tên",
        "Lớp",
        "Trường",
        "Tên nhiệm vụ",
        "Nội dung bài làm",
        "Tên file đính kèm"
      ]);
      
      var timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      subSheet.appendRow([
        timeStr,
        data.studentId,
        data.displayName,
        data.studentClass,
        data.school,
        data.assignmentTitle,
        data.textContent || "",
        data.attachedFileName || "Không có tệp"
      ]);
      
      logActivity(ss, data.studentId, data.displayName, "Nộp bài tự nghiên cứu", data.assignmentTitle);
      return jsonResponse({ success: true, message: "Đã lưu bài nộp vào Google Sheet" });
    }
    
    // 5. Tải file tài liệu lên Google Drive
    if (action === "uploadFile") {
      var folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
      var fileBytes;
      var base64Data = data.fileData;
      
      if (base64Data.indexOf(",") > -1) {
        base64Data = base64Data.split(",")[1];
      }
      
      fileBytes = Utilities.base64Decode(base64Data);
      var mimeType = getMimeType(data.fileType, data.fileName);
      var blob = Utilities.newBlob(fileBytes, mimeType, data.fileName);
      var file = folder.createFile(blob);
      
      // Chia sẻ quyền xem công khai qua link
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      var fileId = file.getId();
      var viewUrl = file.getUrl();
      var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
      
      var docSheet = getOrCreateSheet(ss, "TaiLieuGoogleDrive", [
        "Thời gian tải lên",
        "Tên tài liệu",
        "Chương",
        "Định dạng",
        "Drive File ID",
        "Link xem trực tiếp",
        "Link tải về",
        "Người tải lên"
      ]);
      
      var timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      docSheet.appendRow([
        timeStr,
        data.fileName,
        data.chapter || "Chung",
        data.fileType || "pdf",
        fileId,
        viewUrl,
        downloadUrl,
        data.uploadedBy || "Giáo viên"
      ]);
      
      return jsonResponse({
        success: true,
        fileId: fileId,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        message: "Đã tải file lên Google Drive thành công!"
      });
    }
    
    return jsonResponse({ success: false, error: "Hành động không hợp lệ: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ================= HÀM TIỆN ÍCH HỖ TRỢ =================

function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  // Dự phòng nếu người dùng tạo Apps Script độc lập thay vì trong Google Sheet
  try {
    var files = DriveApp.getFilesByName("QUẢN LÝ HỌC PHẦN LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT");
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
    var fallbackFiles = DriveApp.getFilesByName("CSDL_LY_LUAN_NHA_NUOC_VA_PHAP_LUAT");
    if (fallbackFiles.hasNext()) {
      return SpreadsheetApp.open(fallbackFiles.next());
    }
    // Tự động tạo một bảng tính mới nếu chưa có
    var newSheet = SpreadsheetApp.create("QUẢN LÝ HỌC PHẦN LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT");
    return newSheet;
  } catch (e) {
    Logger.log("Lỗi getSpreadsheet: " + e.toString());
  }
  return null;
}

function getOrCreateSheet(ss, sheetName, headers) {
  if (!ss) {
    ss = getSpreadsheet();
  }
  if (!ss) {
    throw new Error("Không tìm thấy Google Sheet. Vui lòng mở Apps Script từ menu: Tiện ích mở rộng > Apps Script trong Google Trang tính.");
  }
  
  if (!sheetName) sheetName = "HocVien";
  if (!headers) headers = ["Thời gian", "Nội dung"];

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#17365D");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newFolder = DriveApp.createFolder(folderName);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

function logActivity(ss, studentId, studentName, actionName, details) {
  try {
    var actSheet = getOrCreateSheet(ss, "LichSuHoatDong", [
      "Thời gian",
      "Mã sinh viên",
      "Họ và tên",
      "Hành động",
      "Chi tiết"
    ]);
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    actSheet.appendRow([nowStr, studentId, studentName, actionName, details]);
  } catch (e) {
    // Không gián đoạn nếu ghi log phụ gặp lỗi
  }
}

function getMimeType(type, filename) {
  var ext = (filename || "").split(".").pop().toLowerCase();
  if (type === "pdf" || ext === "pdf") return "application/pdf";
  if (type === "docx" || ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (type === "pptx" || ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (type === "xlsx" || ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
