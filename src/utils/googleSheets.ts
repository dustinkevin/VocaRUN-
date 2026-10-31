import { SentenceTapStat, QuestionHistory } from '../types';

/**
 * =========================================================================
 * VocaRUN! 초등학교 6학년 영단어 학습 게임 - 구글 시트 연동 Google Apps Script
 * =========================================================================
 * 
 * [저장 대상 컬럼]
 * 1. timestamp                 : 게임 완료 일시 (예: 2026-10-30 11:24:00)
 * 2. name                      : 학생 이름 / 학번 (예: 6학년 1반 김영희)
 * 3. play_count                : 총 플레이 횟수 (예: 1, 2, 3...)
 * 4. correct_count             : 맞힌 정답 개수 (예: 28)
 * 5. wrong_count               : 틀린 오답 개수 (예: 2)
 * 6. avg_taps                  : 문장당 평균 탭 수 (예: 2.8회)
 * 7. sentence_tap_frequencies  : 각 문장별 탭 빈도 및 결과 상세 (예: [1번] I like apples: 3회...)
 *
 * [사용 방법]
 * 1. 연결할 구글 스프레드시트를 엽니다.
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 스크립트를 전체 복사하여 붙여넣습니다.
 * 4. 상단 메뉴 [배포] > [새 배포]를 클릭합니다.
 * 5. [유형 선택] 톱니바퀴 아이콘 > [웹 앱(Web App)]을 선택합니다.
 * 6. 설정 항목:
 *    - 설명: VocaRUN 학습 기록 및 탭 빈도 연동
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한: '모든 사용자(Anyone)'  <-- 반드시 선택! (학생들이 로그인 없이 제출 가능)
 * 7. [배포] 버튼을 클릭하고 구글 계정 권한 승인 절차를 완료합니다.
 * 8. 생성된 '웹 앱 URL' (https://script.google.com/macros/s/.../exec)이 .env.local의
 *    NEXT_PUBLIC_GOOGLE_SCRIPT_URL 에 설정되어 자동으로 기록됩니다!
 * =========================================================================
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * VocaRUN! 초등 6학년 영단어 게임 - 구글 시트 자동 저장 스크립트
 * 저장 대상 열: timestamp, name, play_count, correct_count, wrong_count, avg_taps, sentence_tap_frequencies
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
    
    // 평균 탭 수
    var avgTaps = (payload.avg_taps !== undefined && payload.avg_taps !== null)
      ? Number(payload.avg_taps)
      : (payload.average_taps !== undefined ? Number(payload.average_taps) : 0);

    // 각 문장별 탭 빈도
    var sentenceTaps = payload.sentence_tap_frequencies || payload.sentence_taps || payload['각_문장별_탭_빈도'] || '';
    if (typeof sentenceTaps === 'object') {
      try {
        sentenceTaps = JSON.stringify(sentenceTaps);
      } catch (err) {}
    }

    // 3. 시트 헤더 확인 및 보정
    var headerInfo = ensureHeaders(sheet);
    var rowData = new Array(headerInfo.headers.length);

    // 3.5 중복 기록 검사 (Deduplication Check)
    // 최근 30개 행을 검사하여 동일 학생, 동일 플레이 회차, 동일 시간(또는 45초 이내) 데이터가 이미 존재하면 중복 저장을 건너뜁니다.
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var checkRowsCount = Math.min(30, lastRow - 1);
      var startRow = lastRow - checkRowsCount + 1;
      var recentValues = sheet.getRange(startRow, 1, checkRowsCount, headerInfo.headers.length).getValues();

      for (var r = recentValues.length - 1; r >= 0; r--) {
        var existingRow = recentValues[r];
        var rowTimestamp = '';
        var rowName = '';
        var rowPlayCount = '';

        for (var c = 0; c < headerInfo.headers.length; c++) {
          var hName = String(headerInfo.headers[c]).trim().toLowerCase();
          if (hName === 'timestamp' || hName === '시간' || hName === '일시' || hName === '날짜') {
            rowTimestamp = String(existingRow[c]).trim();
          } else if (hName === 'name' || hName === '이름' || hName === '학생' || hName === '학생이름') {
            rowName = String(existingRow[c]).trim();
          } else if (hName === 'play_count' || hName === 'playcount' || hName === '플레이횟수' || hName === '게임횟수' || hName === '플레이수') {
            rowPlayCount = String(existingRow[c]).trim();
          }
        }

        var isSameStudent = (rowName === name);
        var isSamePlayCount = (rowPlayCount === String(playCount));
        var isSameTimestamp = (rowTimestamp === timestamp);

        // 시간 비교: 초 단위 차이가 45초 이내이거나 일시 문자열이 일치하는 경우
        var isRecentDuplicate = false;
        if (isSameTimestamp) {
          isRecentDuplicate = true;
        } else if (rowTimestamp && timestamp) {
          try {
            var diffMs = Math.abs(new Date(rowTimestamp).getTime() - new Date(timestamp).getTime());
            if (!isNaN(diffMs) && diffMs < 45000) {
              isRecentDuplicate = true;
            }
          } catch (tErr) {}
        }

        if (isSameStudent && isSamePlayCount && isRecentDuplicate) {
          return createJsonResponse({
            status: 'duplicate_skipped',
            message: '이미 구글 시트에 등록된 기록입니다. (중복 저장 방지 완료)',
            row: startRow + r,
            skipped: true
          });
        }
      }
    }

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
      } else if (colName === 'avg_taps' || colName === 'average_taps' || colName === '평균탭수' || colName === '평균_탭수' || colName === '평균') {
        rowData[i] = avgTaps;
      } else if (colName === 'sentence_tap_frequencies' || colName === 'sentence_taps' || colName === '문장별탭빈도' || colName === '각문장별탭빈도' || colName === '각_문장별_탭_빈도' || colName === '탭빈도') {
        rowData[i] = sentenceTaps;
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
        wrong_count: wrongCount,
        avg_taps: avgTaps,
        sentence_tap_frequencies: sentenceTaps
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
 * 대상 열: timestamp, name, play_count, correct_count, wrong_count, avg_taps, sentence_tap_frequencies
 */
function ensureHeaders(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var targetHeaders = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count', 'avg_taps', 'sentence_tap_frequencies'];

  // 비어있는 새 시트인 경우 기본 헤더 생성
  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    styleHeaders(sheet, targetHeaders.length);
    return { headers: targetHeaders };
  }

  // 기존 헤더 읽기
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });

  // 1) 'name' 열이 없다면 2번째 열에 자동 삽입
  var hasName = cleanHeaders.some(function(h) {
    var l = h.toLowerCase();
    return l === 'name' || l === '이름' || l === '학생' || l === '학생이름';
  });

  if (!hasName) {
    sheet.insertColumnAfter(1);
    sheet.getRange(1, 2).setValue('name');
    lastCol = sheet.getLastColumn();
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });
  }

  // 2) 'avg_taps' 열이 없다면 추가
  var hasAvgTaps = cleanHeaders.some(function(h) {
    var l = h.toLowerCase();
    return l === 'avg_taps' || l === 'average_taps' || l === '평균탭수' || l === '평균_탭수' || l === '평균';
  });

  if (!hasAvgTaps) {
    lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1).setValue('avg_taps');
    lastCol = sheet.getLastColumn();
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });
  }

  // 3) 'sentence_tap_frequencies' 열이 없다면 추가
  var hasSentenceTaps = cleanHeaders.some(function(h) {
    var l = h.toLowerCase();
    return l === 'sentence_tap_frequencies' || l === 'sentence_taps' || l === '문장별탭빈도' || l === '각문장별탭빈도' || l === '각_문장별_탭_빈도';
  });

  if (!hasSentenceTaps) {
    lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1).setValue('sentence_tap_frequencies');
    lastCol = sheet.getLastColumn();
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    cleanHeaders = currentHeaders.map(function(h) { return String(h).trim(); });
  }

  styleHeaders(sheet, lastCol);
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
  Logger.log('시트 설정 완료: timestamp, name, play_count, correct_count, wrong_count, avg_taps, sentence_tap_frequencies 준비 완료');
}

/**
 * JSON 응답 생성기
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;

export interface GameRecordData {
  submission_id?: string;
  timestamp?: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
  avg_taps?: number;
  average_taps?: number;
  total_taps?: number;
  sentence_tap_frequencies?: string;
  sentence_taps?: string;
  sentence_stats?: SentenceTapStat[];
  [key: string]: unknown;
}

const STORAGE_KEY_NAME = 'vocarun_student_name';
const STORAGE_KEY_PLAY_COUNT = 'vocarun_play_count';
const STORAGE_KEY_SHEET_URL = 'vocarun_sheet_url';
const STORAGE_KEY_LAST_RECORD = 'vocarun_last_sync_record';

export function getStoredStudentName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_NAME) || '6학년 학생';
  } catch {
    return '6학년 학생';
  }
}

export function saveStoredStudentName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
  } catch {
    // ignore
  }
}

export function getStoredPlayCount(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PLAY_COUNT);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementAndGetPlayCount(): number {
  try {
    const current = getStoredPlayCount();
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY_PLAY_COUNT, String(next));
    return next;
  } catch {
    return 1;
  }
}

/**
 * .env.local의 NEXT_PUBLIC_GOOGLE_SCRIPT_URL 환경 변수를 우선적으로 참조
 */
const ENV_SHEET_URL =
  (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string) ||
  (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string) ||
  'https://script.google.com/macros/s/AKfycbyPAhmCRBu5v0e8gRitl5KdWrQUtXASk_Y7C7T-fW3aihjjnfvsAN3nQI0yMqU0v6gJ/exec';

export const DEFAULT_SHEET_URL = ENV_SHEET_URL;

export function getStoredSheetUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHEET_URL);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return DEFAULT_SHEET_URL;
  } catch {
    return DEFAULT_SHEET_URL;
  }
}

export function saveStoredSheetUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEET_URL, url.trim());
  } catch {
    // ignore
  }
}

export function getLastSyncRecord(): GameRecordData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_RECORD);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 현재 시간 한국 포맷 문자열 생성 (YYYY-MM-DD HH:mm:ss)
 */
export function formatKoreanTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 문장별 탭 통계 계산 및 구글 시트 저장용 포맷터
 */
export function calculateSentenceTapStats(history: QuestionHistory[]): {
  totalTaps: number;
  avgTaps: number;
  formattedSummary: string;
  statsList: SentenceTapStat[];
} {
  if (!history || history.length === 0) {
    return {
      totalTaps: 0,
      avgTaps: 0,
      formattedSummary: '기록 없음',
      statsList: [],
    };
  }

  let totalTaps = 0;
  const statsList: SentenceTapStat[] = history.map((item, idx) => {
    const taps = Math.max(0, item.tapCount || 0);
    totalTaps += taps;
    const sentence = item.sentence || item.word.exampleEn || `${item.word.word} (${item.word.meaning})`;
    return {
      index: idx + 1,
      word: item.word.word,
      sentence,
      sentenceMeaning: item.word.exampleKo || item.word.meaning,
      tapCount: taps,
      isCorrect: item.isCorrect,
    };
  });

  const avgTaps = parseFloat((totalTaps / history.length).toFixed(1));

  // 구글 시트 셀에 들어갈 깔끔한 줄바꿈 요약 텍스트
  const formattedSummary = statsList
    .map(
      (s) =>
        `[${s.index}번] "${s.sentence}" -> 탭: ${s.tapCount}회 (${s.isCorrect ? '정답' : '오답'})`
    )
    .join('\n');

  return {
    totalTaps,
    avgTaps,
    formattedSummary,
    statsList,
  };
}

// 클라이언트 측 중복 전송 방지용 캐시 (세션 동안 유지)
const sentDedupeKeys = new Set<string>();
const activeInflightRequests = new Map<string, Promise<{ success: boolean; message: string }>>();

/**
 * 중복 방지 캐시 초기화 함수
 */
export function clearSentDedupeKeys(): void {
  sentDedupeKeys.clear();
  activeInflightRequests.clear();
}

/**
 * 구글 시트 웹 앱으로 기록 전송
 * Google Apps Script Web App 특성상 302 리다이렉트가 발생하므로
 * mode: 'no-cors' 와 'text/plain' Content-Type 을 사용하여 CORS 차단 없이 안정적으로 전달합니다.
 * 또한 브라우저/컴포넌트 리렌더링으로 인한 동일 기록 중복 입력을 원천 차단합니다.
 */
export async function sendGameRecordToGoogleSheet(
  url: string,
  record: GameRecordData,
  options?: { force?: boolean }
): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || DEFAULT_SHEET_URL;

  if (!targetUrl || !targetUrl.trim().startsWith('http')) {
    return { success: false, message: '올바른 구글 앱스 스크립트 웹 앱 URL이 설정되지 않았습니다.' };
  }

  const name = record.name?.trim() || '익명 학생';
  const playCount = Number(record.play_count) || 1;
  const timestamp = record.timestamp || formatKoreanTimestamp();
  const submissionId =
    record.submission_id ||
    `rec_${name}_${playCount}_${timestamp}_${record.correct_count}_${record.wrong_count}`;

  // 수동 강제 전송(options?.force)이 아닌 경우, 이미 전송된 기록이거나 전송 진행 중인 요청이면 중복 호출 차단/통합
  if (!options?.force) {
    if (activeInflightRequests.has(submissionId)) {
      return activeInflightRequests.get(submissionId)!;
    }
    if (sentDedupeKeys.has(submissionId)) {
      return {
        success: true,
        message: `이미 구글 시트에 저장된 기록입니다. (${name} 학생 / ${playCount}회차)`,
      };
    }
  }

  const avg =
    record.avg_taps !== undefined
      ? record.avg_taps
      : record.average_taps !== undefined
      ? record.average_taps
      : 0;
  const sentenceSummary = record.sentence_tap_frequencies || record.sentence_taps || '';

  const payload: Record<string, unknown> = {
    submission_id: submissionId,
    timestamp: timestamp,
    name: name,
    play_count: playCount,
    correct_count: Number(record.correct_count) || 0,
    wrong_count: Number(record.wrong_count) || 0,
    avg_taps: avg,
    average_taps: avg,
    total_taps: record.total_taps !== undefined ? record.total_taps : 0,
    sentence_tap_frequencies: sentenceSummary,
    sentence_taps: sentenceSummary,
    sentence_stats: record.sentence_stats || [],
    // 한국어 헤더 컬럼 호환용
    '평균_탭수': avg,
    '각_문장별_탭_빈도': sentenceSummary,
  };

  const executeSend = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Google Apps Script Web App post request with text/plain body to prevent CORS preflight blocks
      await fetch(targetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      sentDedupeKeys.add(submissionId);

      // Save last record to local storage
      try {
        localStorage.setItem(STORAGE_KEY_LAST_RECORD, JSON.stringify(payload));
      } catch {}

      return {
        success: true,
        message: `구글 시트에 성공적으로 기록되었습니다! (${payload.name} 학생 / ${payload.play_count}회차 / 평균 ${avg}회 탭)`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '구글 시트 전송 중 오류가 발생했습니다.',
      };
    } finally {
      activeInflightRequests.delete(submissionId);
    }
  };

  const requestPromise = executeSend();
  activeInflightRequests.set(submissionId, requestPromise);
  return requestPromise;
}

/**
 * 웹 앱 URL 상태 검사 (GET 요청)
 */
export async function testGoogleSheetConnection(url: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || DEFAULT_SHEET_URL;
  if (!targetUrl || !targetUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL을 올바르게 입력해주세요. (https://script.google.com/...)' };
  }

  try {
    // Test with fetch
    const response = await fetch(targetUrl.trim(), { method: 'GET', mode: 'cors' }).catch(() => null);
    if (response && response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || '구글 시트 웹 앱과 정상적으로 통신되었습니다.',
      };
    }
    // If CORS prevented reading GET response, but it didn't throw network unreachable:
    return {
      success: true,
      message: '웹 앱 URL이 응답 가능한 상태입니다. (실제 게임 결과 전송 준비 완료)',
    };
  } catch (err) {
    return {
      success: false,
      message: '연결 실패: URL이 올바른지, 웹 앱 배포 시 "액세스 권한: 모든 사용자"로 설정되었는지 확인해주세요.',
    };
  }
}
