import Link from "next/link";
import { Shield } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">Redline<span className="text-red-500">AI</span></span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">환불 정책</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2026년 4월</p>

          <div className="space-y-6 text-slate-300 leading-relaxed">

            <div className="bg-[#1e3050] rounded-xl p-4 border border-[#2a4070]">
              <p className="text-white font-semibold">Paddle의 이용약관에 따라 14일 환불 정책을 운영하고 있습니다.</p>
              <p className="text-slate-300 mt-2">구매일로부터 14일 이내에{" "}
                <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>으로 연락 주시면 전액 환불을 요청하실 수 있습니다.
              </p>
              <p className="text-slate-300 mt-2">14일이 지난 환불 요청은 개별적으로 검토됩니다.</p>
              <p className="text-slate-400 text-sm mt-3">
                참고: RedlineAI는 Pactbug이 운영합니다. 결제는 저희의 Merchant of Record(판매자)인
                Paddle이 &ldquo;Trytimeback&rdquo;이라는 상호로 처리합니다. RedlineAI 관련 결제 시
                카드 명세서에는 &ldquo;Trytimeback&rdquo; 또는 &ldquo;Paddle.net&rdquo;으로 표시될 수 있습니다.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">환불 요청 방법</h2>
              <ol className="list-decimal list-inside space-y-2 text-slate-400">
                <li><a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>으로 이메일 발송</li>
                <li>계정에 등록된 이메일 주소를 함께 알려주세요</li>
                <li>환불을 요청하시는 사유를 간단히 설명해 주세요</li>
                <li>영업일 기준 3~5일 이내에 요청을 처리해 드립니다</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">환불 대상</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>최초 구매일로부터 <span className="text-white font-medium">14일</span> 이내 환불 가능</li>
                <li>가장 최근 결제 건에 한해서만 환불 가능</li>
                <li>이용 기간 중 일부에 대한 부분 환불은 제공되지 않습니다</li>
                <li>이용약관을 위반한 계정은 환불 대상에서 제외됩니다</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">처리 절차</h2>
              <p className="text-slate-400">승인된 환불은 저희의 결제 서비스 제공업체인 Paddle을 통해 처리됩니다. 환불은 은행이나 카드사에 따라 영업일 기준 5~10일 이내에 명세서에 반영되는 것이 일반적입니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">구독 해지</h2>
              <p className="text-slate-400">계정 설정에서 언제든지 구독을 해지하실 수 있습니다. 해지 시 이후 결제는 중단되지만 자동으로 환불이 이루어지지는 않습니다. 해지와 함께 환불을 원하시는 경우 별도로 문의해 주세요.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">문의</h2>
              <p className="text-slate-400">
                환불 정책에 대해 궁금하신 점은 아래로 문의해 주세요:{" "}
                <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>
              </p>
            </section>
          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">이용약관</Link>
          <Link href="/privacy" className="hover:text-slate-300">개인정보처리방침</Link>
          <Link href="/" className="hover:text-slate-300">홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
