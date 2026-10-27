/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT: ĐỒNG BỘ THỜI GIAN THỰC GOOGLE SHEET & GOOGLE DRIVE
 * Học phần: Lý luận Nhà nước và Pháp luật - Học viện PCCC & CNCH
 * =========================================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE:
 * 1. Mở Google Drive, tạo 1 file Google Trang tính (Google Sheets) mới, ví dụ đặt tên:
 *    "CSDL_LY_LUAN_NHA_NUOC_VA_PHAP_LUAT"
 * 2. Trên thanh menu Google Sheets, chọn: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa hết code mặc định trong file Code.gs và dán toàn bộ đoạn mã bên dưới vào.
 * 4. Nhấn biểu tượng Lưu (Save).
 * 5. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải > "Tùy chọn triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web App).
 *    - Mô tả: "API Dong bo Ly luan Nha nuoc va Phap luat v1".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me - địa chỉ email của bạn).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG để app web gọi được API.
 * 6. Nhấn "Triển khai" (Deploy), cấp quyền truy cập tài khoản Google (nhấn Nâng cao > Đi tới dự án).
 * 7. Sao chép "URL ứng dụng web" (Web App URL có dạng: https://script.google.com/macros/s/.../exec)
 *    và dán vào mục Cài đặt Google Sheet trong ứng dụng web!
 * =========================================================================================
 */

// Tên thư mục lưu trữ tài liệu trên Google Drive
var DRIVE_FOLDER_NAME = "HOC_LIEU_LY_LUAN_NHA_NUOC_VA_PHAP_LUAT";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script API - Ly luan Nha nuoc va Phap luat dang hoat dong!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Kiểm tra kết nối
    if (action === "ping") {
      return jsonResponse({ success: true, message: "Kết nối Google Apps Script thành công!" });
    }
    
    // 2. Đồng bộ thông tin học viên
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
        // Cập nhật học viên cũ
        sheet.getRange(foundIndex, 3).setValue(data.displayName);
        sheet.getRange(foundIndex, 4).setValue(data.studentClass);
        sheet.getRange(foundIndex, 5).setValue(data.school);
        sheet.getRange(foundIndex, 6).setValue(data.email);
        sheet.getRange(foundIndex, 7).setValue(nowStr);
      } else {
        // Thêm học viên mới
        sheet.appendRow([
          nowStr,
          studentId,
          data.displayName,
          data.studentClass,
          data.school,
          data.email,
          nowStr
        ]);
      }
      
      logActivity(ss, studentId, data.displayName, "Đăng ký / cập nhật hồ sơ học viên", data.studentClass + " - " + data.school);
      return jsonResponse({ success: true, message: "Đã lưu học viên vào Google Sheet" });
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
      
      logActivity(ss, data.studentId, data.displayName, "Hoàn thành bài trắc nghiệm", data.quizTitle + " - Điểm: " + data.score + "/10");
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
      return jsonResponse({ success: true, message: "Đã lưu bài tự nghiên cứu vào Google Sheet" });
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
      
      // Ghi lại danh sách tài liệu vào tab TaiLieuDrive
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
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Định dạng dòng tiêu đề: in đậm, nền xanh navy, chữ trắng
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
