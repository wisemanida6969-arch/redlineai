import Link from "next/link";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">Redline<span className="text-red-500">AI</span></span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">개인정보처리방침</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2026년 4월</p>

          <div className="space-y-6 text-slate-300 leading-relaxed">

            <div className="bg-[#1e3050] rounded-xl p-4 border border-[#2a4070]">
              <p className="text-white font-semibold">본 서비스는 Pactbug이 운영합니다.</p>
              <p className="text-slate-300 mt-1 text-sm">저희는 귀하의 개인정보 보호를 중요하게 생각합니다. 본 방침은 저희가 수집하는 정보, 이를 사용하는 방식, 그리고 귀하의 권리에 대해 설명합니다.</p>
              <p className="text-slate-400 text-xs mt-3">
                결제는 저희의 Merchant of Record(판매자)인 Paddle이 &ldquo;Trytimeback&rdquo;이라는 상호로 처리합니다.
                결제 관련 데이터는 Paddle의 개인정보처리방침에 따라 처리됩니다.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. 수집하는 정보</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-medium mb-1">계정 정보</h3>
                  <p className="text-slate-400 text-sm">Google로 로그인하시면 Google로부터 이름, 이메일 주소, 프로필 사진을 전달받습니다. 계정 식별을 위해 이메일 주소를 저장합니다.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">업로드하신 문서</h3>
                  <p className="text-slate-400 text-sm">업로드하신 계약서 및 문서는 저희 AI가 비교 리포트를 생성하는 데 사용됩니다. 문서 내용은 오직 비교 목적으로만 사용되며, 처리 후 영구적으로 저장되지 않습니다.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">이용 데이터</h3>
                  <p className="text-slate-400 text-sm">스캔 기록 제공을 위해 스캔 횟수, 스캔 날짜, 리포트 요약 등 기본적인 이용 정보를 수집합니다.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">결제 정보</h3>
                  <p className="text-slate-400 text-sm">결제 처리는 전적으로 Paddle이 담당합니다. 저희는 귀하의 신용카드 또는 결제 정보를 저희 서버에 저장하지 않습니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. 정보 이용 방법</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li>레드라인AI 서비스 제공, 운영 및 개선을 위해</li>
                <li>귀하의 신원을 인증하고 계정을 유지하기 위해</li>
                <li>업로드하신 문서를 처리하고 AI 비교 리포트를 생성하기 위해</li>
                <li>구독 요금제 및 이용 한도를 관리하기 위해</li>
                <li>서비스 관련 중요 안내를 전달하기 위해</li>
                <li>고객 문의에 응답하기 위해</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. 정보 제공</h2>
              <p className="text-slate-400 text-sm mb-3">저희는 귀하의 개인정보를 판매하지 않습니다. 아래 서비스 제공업체에만 데이터를 공유합니다:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li><span className="text-white">Supabase</span> — 인증 및 데이터베이스 저장</li>
                <li><span className="text-white">Anthropic (Claude AI)</span> — 업로드된 문서의 AI 비교·분석</li>
                <li><span className="text-white">Paddle</span> — 유료 구독 결제 처리</li>
                <li><span className="text-white">Railway</span> — 클라우드 인프라 및 호스팅</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. 문서 개인정보 보호</h2>
              <p className="text-slate-400 text-sm">업로드하신 문서는 비교·분석 생성을 위해 메모리 상에서 처리됩니다. 문서 텍스트는 분석을 위해 Anthropic의 Claude AI API로 전송됩니다. 업로드하신 문서의 전체 내용은 영구적으로 저장하지 않으며, 스캔 기록에는 리포트 요약과 조항 메타데이터만 저장됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. 데이터 보관 기간</h2>
              <p className="text-slate-400 text-sm">계정이 활성 상태인 동안 계정 정보와 스캔 기록을 보관합니다. 언제든지 저희에게 연락하여 데이터 삭제를 요청하실 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. 보안</h2>
              <p className="text-slate-400 text-sm">저희는 암호화 연결(HTTPS), Supabase를 통한 안전한 인증, 데이터에 대한 행 단위 보안(row-level security) 등 업계 표준 보안 조치를 적용하고 있습니다. 다만 인터넷을 통한 전송 방식 중 100% 안전한 방법은 없다는 점을 유의해 주시기 바랍니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. 귀하의 권리</h2>
              <p className="text-slate-400 text-sm mb-2">귀하는 다음의 권리를 가집니다:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li>저희가 보유한 귀하의 개인정보에 접근할 권리</li>
                <li>부정확한 정보의 정정을 요청할 권리</li>
                <li>계정 및 관련 데이터의 삭제를 요청할 권리</li>
                <li>계정 삭제를 통해 언제든지 동의를 철회할 권리</li>
              </ul>
              <p className="text-slate-400 text-sm mt-2">이러한 권리를 행사하시려면 <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>으로 연락해 주세요.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. 쿠키</h2>
              <p className="text-slate-400 text-sm">저희는 로그인 상태 유지 등 인증 목적을 위한 필수 쿠키만 사용합니다. 추적 또는 광고 목적의 쿠키는 사용하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">9. 아동의 개인정보 보호</h2>
              <p className="text-slate-400 text-sm">레드라인AI는 만 18세 미만의 이용을 위한 서비스가 아닙니다. 저희는 아동의 개인정보를 고의로 수집하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">10. 본 방침의 변경</h2>
              <p className="text-slate-400 text-sm">저희는 본 개인정보처리방침을 수시로 업데이트할 수 있습니다. 중대한 변경 사항이 있는 경우 웹사이트에 공지를 게시하여 안내합니다. 변경 후 서비스를 계속 이용하는 경우 업데이트된 방침에 동의한 것으로 간주됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">11. 문의</h2>
              <p className="text-slate-400 text-sm">
                본 개인정보처리방침에 대해 궁금하신 점은 아래로 문의해 주세요:{" "}
                <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>
              </p>
            </section>

          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">이용약관</Link>
          <Link href="/refund" className="hover:text-slate-300">환불 정책</Link>
          <Link href="/" className="hover:text-slate-300">홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
