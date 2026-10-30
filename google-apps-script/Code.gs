/**
 * =========================================================================
 * VocaRUN! 초등학교 6학년 영단어 학습 게임 - 구글 시트 연동 Google Apps Script
 * =========================================================================
 * 
 * [저장 대상 컬럼]
 * 1. timestamp     : 게임 완료 일시 (예: 2026-10-30 11:24:00)
 * 2. name          : 학생 이름 / 학번 (예: 6학년 1반 김영희)
 * 3. play_count    : 총 플레이 횟수 (예: 1, 2, 3...)
 * 4. correct_count : 맞힌 정답 개수 (예: 28)
 * 5. wrong_count   : 틀린 오답 개수 (예: 2)
 *
 * [사용 방법]
 * 1. 구글 스프레드시트 열기
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 3. 기존 코드를 모두 지우고 이 스크립트를 전체 복사하여 붙여넣기
 * 4. 상단 메뉴 [배포] > [새 배포] 클릭
 * 5. [유형 선택] 톱니바퀴 > [웹 앱(Web App)] 선택
 * 6. 설정 항목:
 *    - 설명: VocaRUN 영단어 게임 연동
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한: '모든 사용자(Anyone)'  <-- 반드시 선택! (학생들이 로그인 없이 제출 가능)
 * 7. [배포] 클릭 후 승인 절차 완료
 * 8. 생성된 '웹 앱 URL' (https://script.google.com/macros/s/.../exec)을 복사하여
 *    VocaRUN 게임 내 '구글 시트 연동 설정'에 입력하면 끝!
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 동시 다수 학생 제출 시 데이터 꼬임 방지를 위해 30초 대기
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: '서버가 혼잡하여 잠금을 획득하지 못했습니다: ' + err.toString()
    });
  }

  try {
    var sheet = getTargetSheet();
    var payload = {};

    // 1. 요청 파싱 (JSON 또는 URL 인코딩 지원)
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        if (e.parameter) {
          payload = e.parameter;
        }
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // 2. 값 정제 및 기본값 지정
    var timestamp = payload.timestamp || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var name = (payload.name !== undefined && payload.name !== null && String(payload.name).trim() !== '') 
      ? String(payload.name).trim() 
      : '익명 학생';
    var playCount = (payload.play_count !== undefined && payload.play_count !== null) 
      ? Number(payload.play_count) 
      : 1;
    var correctCount = (payload.correct_count !== undefined && payload.correct_count !== null) 
      ? Number(payload.correct_count) 
      : 0;
    var wrongCount = (payload.wrong_count !== undefined && payload.wrong_count !== null) 
      ? Number(payload.wrong_count) 
      : 0;

    // 3. 시트 헤더 확인 및 보정 (timestamp, name, play_count, correct_count, wrong_count)
    var headerInfo = ensureHeaders(sheet);
    var rowData = new Array(headerInfo.headers.length);

    for (var i = 0; i < headerInfo.headers.length; i++) {
      var colName = String(headerInfo.headers[i]).trim().toLowerCase();
      if (colName === 'timestamp' || colName === '시간' || colName === '일시' || colName === '날짜') {
        rowData[i] = timestamp;
      } else if (colName === 'name' || colName === '이름' || colName === '학생' || colName === '학생이름') {
        rowData[i] = name;
      } else if (colName === 'play_count' || colName === 'playcount' || colName === '플레이횟수' || colName === '게임횟수' || colName === '플레이수') {
        rowData[i] = playCount;
      } else if (colName === 'correct_count' || colName === 'correctcount' || colName === '정답수' || colName === '맞힌개수' || colName === '정답') {
        rowData[i] = correctCount;
      } else if (colName === 'wrong_count' || colName === 'wrongcount' || colName === '오답수' || colName === '틀린개수' || colName === '오답') {
        rowData[i] = wrongCount;
      } else {
        rowData[i] = payload[headerInfo.headers[i]] || '';
      }
    }

    // 4. 행 추가
    sheet.appendRow(rowData);
    var lastRow = sheet.getLastRow();

    // 5. 성공 결과 반환
    return createJsonResponse({
      status: 'success',
      message: '성공적으로 구글 시트에 기록되었습니다.',
      row: lastRow,
      data: {
        timestamp: timestamp,
        name: name,
        play_count: playCount,
        correct_count: correctCount,
        wrong_count: wrongCount
      }
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 웹 앱 URL 브라우저 접속 확인용 (GET 요청)
 */
function doGet(e) {
  var sheet = getTargetSheet();
  var lastRow = sheet.getLastRow();
  var recordCount = Math.max(0, lastRow - 1);

  return createJsonResponse({
    status: 'ok',
    title: 'VocaRUN! - 초등 6학년 영단어 게임 연동 서비스',
    message: '구글 시트 연동 웹 앱이 정상적으로 배포되어 작동 중입니다.',
    sheetName: sheet.getName(),
    totalRecordedPlays: recordCount,
    serverTime: Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss")
  });
}

/**
 * 현재 활성화된 시트 획득
 */
function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getActiveSheet();
}

/**
 * 헤더 행 검사 및 자동 보정
 * 대상 열: timestamp, name, play_count, correct_count, wrong_count
 */
function ensureHeaders(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var targetHeaders = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count'];

  // 비어있는 새 시트인 경우 기본 헤더 생성
  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    styleHeaders(sheet, targetHeaders.length);
    return { headers: targetHeaders };
  }

  // 기존 헤더 읽기
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });

  // 만약 첨부 파일처럼 timestamp,play_count,correct_count,wrong_count 로 되어 있어 'name' 열이 없다면
  var hasName = cleanHeaders.some(function(h) {
    var l = h.toLowerCase();
    return l === 'name' || l === '이름' || l === '학생' || l === '학생이름';
  });

  if (!hasName) {
    // 2번째 열에 'name' 열 자동 삽입
    sheet.insertColumnAfter(1);
    sheet.getRange(1, 2).setValue('name');
    lastCol = sheet.getLastColumn();
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });
    styleHeaders(sheet, lastCol);
  }

  return { headers: cleanHeaders };
}

/**
 * 헤더 스타일 서식 적용 (청록/파랑 테마)
 */
function styleHeaders(sheet, colCount) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, colCount);
    headerRange.setBackground('#0284c7'); // Sky blue
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  } catch (err) {}
}

/**
 * Apps Script 편집기에서 실행 가능한 테스트 및 셋업 함수
 */
function setupSheet() {
  var sheet = getTargetSheet();
  ensureHeaders(sheet);
  Logger.log('시트 설정 완료: timestamp, name, play_count, correct_count, wrong_count 준비 완료');
}

/**
 * JSON 응답 생성기
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
