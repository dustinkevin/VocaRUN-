import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  ExternalLink,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Send,
  User,
  Hash,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  getStoredSheetUrl,
  saveStoredSheetUrl,
  getStoredStudentName,
  saveStoredStudentName,
  getStoredPlayCount,
  testGoogleSheetConnection,
  sendGameRecordToGoogleSheet,
  formatKoreanTimestamp,
} from '../utils/googleSheets';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (name: string, url: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [sheetUrl, setSheetUrl] = useState<string>(() => getStoredSheetUrl());
  const [studentName, setStudentName] = useState<string>(() => getStoredStudentName());
  const [copied, setCopied] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = GOOGLE_APPS_SCRIPT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveSettings = () => {
    saveStoredSheetUrl(sheetUrl);
    saveStoredStudentName(studentName);
    if (onSave) {
      onSave(studentName, sheetUrl);
    }
    onClose();
  };

  const handleTestConnection = async () => {
    if (!sheetUrl.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: '구글 앱스 스크립트 웹 앱 URL을 먼저 입력해주세요.',
      });
      return;
    }

    setTestStatus({ loading: true });
    // First test GET
    const testGet = await testGoogleSheetConnection(sheetUrl);
    
    // Also test a dummy test record
    const playCount = getStoredPlayCount() || 1;
    const testPost = await sendGameRecordToGoogleSheet(
      sheetUrl,
      {
        timestamp: formatKoreanTimestamp(),
        name: `${studentName.trim() || '6학년 테스트'} (테스트)`,
        play_count: playCount,
        correct_count: 30,
        wrong_count: 0,
        avg_taps: 2.3,
        average_taps: 2.3,
        total_taps: 69,
        sentence_tap_frequencies: '[1번] "We go to school together." -> 탭: 2회 (정답)\n[2번] "I like red apples." -> 탭: 3회 (정답)',
      },
      { force: true }
    );

    if (testPost.success || testGet.success) {
      setTestStatus({
        loading: false,
        success: true,
        message: '연결 성공! 구글 시트에 테스트 행(timestamp, name, play_count, correct_count, wrong_count, avg_taps, sentence_tap_frequencies)이 기록되었습니다.',
      });
      saveStoredSheetUrl(sheetUrl);
      saveStoredStudentName(studentName);
    } else {
      setTestStatus({
        loading: false,
        success: false,
        message: testPost.message || testGet.message || '연결에 실패했습니다.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                구글 시트 연동 설정
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  선생님/관리자 1회 설정
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                학생(플레이어)은 링크를 몰라도 되며, 이름만 입력하면 자동 기록됩니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content with scrollbar */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-sm">
          {/* Target Columns Summary Banner */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                구글 시트 자동 저장 7개 열(Columns) 안내
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                .env.local 연동 완료
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center text-xs">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">1열</span>
                <span className="font-bold text-cyan-300 text-[11px]">timestamp</span>
                <span className="text-[9px] text-slate-400 block">완료 일시</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">2열</span>
                <span className="font-bold text-amber-300 text-[11px]">name</span>
                <span className="text-[9px] text-slate-400 block">학생 이름</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">3열</span>
                <span className="font-bold text-sky-300 text-[11px]">play_count</span>
                <span className="text-[9px] text-slate-400 block">플레이 횟수</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">4열</span>
                <span className="font-bold text-emerald-400 text-[11px]">correct_count</span>
                <span className="text-[9px] text-slate-400 block">정답 개수</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">5열</span>
                <span className="font-bold text-rose-400 text-[11px]">wrong_count</span>
                <span className="text-[9px] text-slate-400 block">오답 개수</span>
              </div>
              <div className="bg-cyan-950/80 p-1.5 rounded-lg border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 block font-mono">6열</span>
                <span className="font-bold text-cyan-300 text-[11px]">avg_taps</span>
                <span className="text-[9px] text-cyan-200 block">평균 탭수</span>
              </div>
              <div className="bg-indigo-950/80 p-1.5 rounded-lg border border-indigo-500/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-indigo-400 block font-mono">7열</span>
                <span className="font-bold text-indigo-300 text-[11px]">sentence_taps</span>
                <span className="text-[9px] text-indigo-200 block">문장별 탭빈도</span>
              </div>
            </div>
          </div>

          {/* Student Name & Current Play Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>학생 이름 / 학번</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 6학년 1반 김민준"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>누적 플레이 횟수 (자동 기록)</span>
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-sm flex items-center justify-between font-mono">
                <span>현재 누적:</span>
                <span className="font-bold text-amber-300 text-base">{getStoredPlayCount()}회</span>
              </div>
            </div>
          </div>

          {/* Teacher Info Note */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>💡 Q. 학생(사용자)도 이 링크를 알아야 하나요?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              <strong className="text-white">아닙니다! 학생은 링크가 전혀 필요 없습니다.</strong><br />
              선생님께서 구글 시트에서 배포한 웹 앱 URL을 여기에 <strong>한 번만 입력</strong>해두시면, 학생들은 평소처럼 게임 주소로 들어와서 이름만 입력하고 플레이하면 모든 결과가 선생님 구글 시트로 자동 전송됩니다.
            </p>
          </div>

          {/* Web App URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>선생님의 구글 앱스 스크립트 웹 앱 URL</span>
              </label>
              <span className="text-[11px] text-amber-400/90 font-medium">
                (선생님만 1회 등록)
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 text-xs sm:text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus.loading}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                {testStatus.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>연동 테스트</span>
              </button>
            </div>

            {testStatus.message && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                }`}
              >
                {testStatus.success ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>구글 시트 연동 초간단 4단계 설정법</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors cursor-pointer shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : '앱스 스크립트 코드 복사'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                <strong className="text-white">구글 스프레드시트 열기:</strong> 원하는 구글 시트를 열고 상단 메뉴의{' '}
                <span className="text-cyan-300 font-semibold">[확장 프로그램] → [Apps Script]</span>를 클릭합니다.
              </li>
              <li>
                <strong className="text-white">스크립트 붙여넣기:</strong> 열린 편집창의 기존 코드를 모두 지우고, 우측 상단{' '}
                <span className="text-cyan-300 font-semibold">[앱스 스크립트 코드 복사]</span> 버튼을 눌러 붙여넣은 뒤 저장(Ctrl+S)합니다.
              </li>
              <li>
                <strong className="text-white">웹 앱으로 배포:</strong> 우측 상단{' '}
                <span className="text-amber-300 font-semibold">[배포] → [새 배포]</span> 클릭 후, 유형을{' '}
                <span className="text-emerald-300 font-semibold">[웹 앱]</span>으로 선택합니다.{' '}
                (액세스 권한을 <span className="text-rose-300 font-semibold underline">모든 사용자(Anyone)</span>로 설정해야 학생들이 로그인 없이 기록됩니다!)
              </li>
              <li>
                <strong className="text-white">URL 입력:</strong> 배포 후 생성된{' '}
                <span className="text-cyan-300 font-semibold">웹 앱 URL</span>을 복사하여 위의 입력창에 붙여넣고 [저장하기]를 누르면 끝!
              </li>
            </ol>
          </div>

          {/* Google Apps Script Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300">구글 앱스 스크립트 코드 미리보기 (Code.gs)</span>
              <span className="text-[11px] font-mono">자동 열 매핑 & 잠금 처리 포함</span>
            </div>
            <div className="relative">
              <pre className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto custom-scrollbar select-all">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs flex items-center gap-1 shadow cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사됨' : '복사'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-400">
            {sheetUrl ? '연동 URL이 등록되어 있습니다' : 'URL을 등록하면 게임 종료 시 자동 기록됩니다'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              설정 저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
