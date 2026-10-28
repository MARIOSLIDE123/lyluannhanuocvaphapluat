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

  getOrCreateSheet(ss, "KhoHocLieu", [
    "ID Tài liệu",
    "Tên tài liệu",
    "Mô tả",
    "Phân loại",
    "Chương học",
    "Tác giả / Cơ quan",
    "Ngày ban hành",
    "Ngày hiệu lực",
    "Tình trạng hiệu lực",
    "Ghi chú thay thế",
    "Link Google Drive / Nguồn",
    "Tên tệp",
    "Dung lượng",
    "Định dạng",
    "Người tải lên",
    "Thời gian cập nhật"
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
  var action = (e && e.parameter && e.parameter.action) || "";
  if (action === "getMaterials") {
    var ss = getSpreadsheet();
    return jsonResponse(getMaterialsFromSheet(ss));
  }

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
      
      // Đồng thời cập nhật hoặc thêm vào KhoHocLieu để hiển thị trực tiếp cho học viên
      var matSheet = getOrCreateSheet(ss, "KhoHocLieu", [
        "ID Tài liệu", "Tên tài liệu", "Mô tả", "Phân loại", "Chương học",
        "Tác giả / Cơ quan", "Ngày ban hành", "Ngày hiệu lực", "Tình trạng hiệu lực",
        "Ghi chú thay thế", "Link Google Drive / Nguồn", "Tên tệp", "Dung lượng",
        "Định dạng", "Người tải lên", "Thời gian cập nhật"
      ]);
      var matId = data.id || ("mat-drive-" + fileId);
      matSheet.appendRow([
        matId,
        data.title || data.fileName,
        data.description || "Tài liệu học tập tải lên từ Google Drive",
        data.category || "02_textbooks",
        data.chapter || "Chương chung",
        data.authorOrIssuer || "Khoa Luật",
        "",
        "",
        "active",
        "",
        viewUrl,
        data.fileName,
        data.fileSize || "1.0 MB",
        data.fileType || "pdf",
        data.uploadedBy || "Giáo viên",
        timeStr
      ]);

      return jsonResponse({
        success: true,
        fileId: fileId,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        message: "Đã tải file lên Google Drive thành công!"
      });
    }

    // 6. Lấy danh sách tài liệu học tập (cho cả Học viên & Giáo viên)
    if (action === "getMaterials") {
      return jsonResponse(getMaterialsFromSheet(ss));
    }

    // 7. Đồng bộ chi tiết tài liệu học tập (Giáo viên tạo / sửa)
    if (action === "syncMaterial") {
      var matSheet = getOrCreateSheet(ss, "KhoHocLieu", [
        "ID Tài liệu",
        "Tên tài liệu",
        "Mô tả",
        "Phân loại",
        "Chương học",
        "Tác giả / Cơ quan",
        "Ngày ban hành",
        "Ngày hiệu lực",
        "Tình trạng hiệu lực",
        "Ghi chú thay thế",
        "Link Google Drive / Nguồn",
        "Tên tệp",
        "Dung lượng",
        "Định dạng",
        "Người tải lên",
        "Thời gian cập nhật"
      ]);

      var matId = (data.id || "").toString().trim();
      if (!matId) {
        matId = "mat-" + new Date().getTime();
      }

      var rows = matSheet.getDataRange().getValues();
      var foundRow = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString().trim() === matId) {
          foundRow = i + 1;
          break;
        }
      }

      var nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var rowData = [
        matId,
        data.title || "Tài liệu chưa đặt tên",
        data.description || "",
        data.category || "02_textbooks",
        data.chapter || "Chương chung",
        data.authorOrIssuer || "",
        data.issueDate || "",
        data.effectiveDate || "",
        data.validityStatus || "active",
        data.replacementNotes || "",
        data.officialUrl || "",
        data.fileName || "",
        data.fileSize || "1.0 MB",
        data.fileType || "pdf",
        data.uploadedByName || "ThS. Ngô Thị Mai Anh",
        nowStr
      ];

      if (foundRow > 0) {
        matSheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        matSheet.appendRow(rowData);
      }

      logActivity(ss, "GV-MAIANH", data.uploadedByName || "Giáo viên", "Tải lên / Cập nhật tài liệu", data.title || matId);
      return jsonResponse({
        success: true,
        id: matId,
        message: "Đã đồng bộ tài liệu vào Google Sheet thành công!"
      });
    }

    // 8. Xóa tài liệu khỏi Google Sheet (Cả KhoHocLieu và TaiLieuGoogleDrive)
    if (action === "deleteMaterial") {
      var matId = (data.id || "").toString().trim();
      var cleanFileId = matId.replace("mat-drive-", "");

      // 8.1. Xóa khỏi KhoHocLieu
      var matSheet = ss.getSheetByName("KhoHocLieu");
      if (matSheet) {
        var rows = matSheet.getDataRange().getValues();
        for (var i = rows.length - 1; i >= 1; i--) {
          var rowId = (rows[i][0] || "").toString().trim();
          var rowUrl = (rows[i][10] || "").toString();
          if (rowId === matId || (cleanFileId && (rowId.indexOf(cleanFileId) > -1 || rowUrl.indexOf(cleanFileId) > -1))) {
            matSheet.deleteRow(i + 1);
          }
        }
      }

      // 8.2. Xóa khỏi TaiLieuGoogleDrive
      var driveSheet = ss.getSheetByName("TaiLieuGoogleDrive");
      if (driveSheet) {
        var dRows = driveSheet.getDataRange().getValues();
        for (var j = dRows.length - 1; j >= 1; j--) {
          var dFileId = (dRows[j][4] || "").toString().trim();
          var dViewUrl = (dRows[j][5] || "").toString();
          if (dFileId === matId || dFileId === cleanFileId || (cleanFileId && (dFileId.indexOf(cleanFileId) > -1 || dViewUrl.indexOf(cleanFileId) > -1))) {
            driveSheet.deleteRow(j + 1);
          }
        }
      }
      return jsonResponse({ success: true, message: "Đã xóa tài liệu khỏi Google Sheet và Drive!" });
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

function getMaterialsFromSheet(ss) {
  try {
    if (!ss) ss = getSpreadsheet();
    var sheet = ss ? ss.getSheetByName("KhoHocLieu") : null;
    var materials = [];

    if (sheet) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r[0] && !r[1]) continue;
        materials.push({
          id: (r[0] || ("mat-" + i)).toString(),
          title: (r[1] || "").toString(),
          description: (r[2] || "").toString(),
          category: (r[3] || "02_textbooks").toString(),
          chapter: (r[4] || "Chương chung").toString(),
          authorOrIssuer: (r[5] || "").toString(),
          issueDate: (r[6] || "").toString(),
          effectiveDate: (r[7] || "").toString(),
          validityStatus: (r[8] || "active").toString(),
          replacementNotes: (r[9] || "").toString(),
          officialUrl: (r[10] || "").toString(),
          fileName: (r[11] || "").toString(),
          fileSize: (r[12] || "1.0 MB").toString(),
          fileType: (r[13] || "pdf").toString(),
          uploadedByName: (r[14] || "ThS. Ngô Thị Mai Anh").toString(),
          uploadedAt: (r[15] || "").toString(),
          status: "published",
          isSample: false
        });
      }
    }

    // Đọc thêm từ TaiLieuGoogleDrive nếu có file tải lên mà chưa có trong KhoHocLieu
    var driveSheet = ss ? ss.getSheetByName("TaiLieuGoogleDrive") : null;
    if (driveSheet) {
      var dRows = driveSheet.getDataRange().getValues();
      for (var k = 1; k < dRows.length; k++) {
        var dr = dRows[k];
        var fileId = dr[4] ? dr[4].toString() : "";
        var viewUrl = dr[5] ? dr[5].toString() : "";
        var exists = materials.some(function(m) {
          return m.officialUrl === viewUrl || (fileId && m.id.indexOf(fileId) > -1);
        });

        if (!exists && dr[1]) {
          materials.unshift({
            id: "mat-drive-" + (fileId || k),
            title: dr[1].toString(),
            description: "Tài liệu học phần tải lên Google Drive",
            category: "02_textbooks",
            chapter: dr[2] ? dr[2].toString() : "Chương chung",
            authorOrIssuer: "Khoa Luật",
            issueDate: "",
            effectiveDate: "",
            validityStatus: "active",
            replacementNotes: "",
            officialUrl: viewUrl,
            fileName: dr[1].toString(),
            fileSize: "1.0 MB",
            fileType: dr[3] ? dr[3].toString() : "pdf",
            uploadedByName: dr[7] ? dr[7].toString() : "Giáo viên",
            uploadedAt: dr[0] ? dr[0].toString() : "",
            status: "published",
            isSample: false
          });
        }
      }
    }

    return {
      success: true,
      materials: materials,
      total: materials.length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.toString(), materials: [] };
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
