import Link from "next/link";
import { Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">Redline<span className="text-red-500">AI</span></span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">이용약관</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2026년 4월</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">

            <div className="bg-[#1e3050] rounded-xl p-4 border border-[#2a4070]">
              <p className="text-white font-semibold">본 서비스는 Pactbug이 운영합니다.</p>
              <p className="text-slate-400 text-sm mt-2">
                레드라인AI는 Pactbug이 운영합니다. 결제는 저희의 Merchant of Record(판매자)인{" "}
                <span className="text-white">Paddle.com Market Limited</span>가{" "}
                <span className="text-white">Trytimeback</span>이라는 상호로 처리합니다. 레드라인AI 관련 결제 시
                카드 명세서에는 &ldquo;Trytimeback&rdquo; 또는 &ldquo;Paddle.net&rdquo;으로 표시될 수 있습니다.
              </p>
            </div>

            <div className="bg-yellow-900/15 border border-yellow-700/30 rounded-xl p-4">
              <p className="text-yellow-200 font-semibold mb-1">면책 조항</p>
              <p className="text-yellow-200/90 text-sm">
                레드라인AI는 프리랜서 권익 보호를 위해 계약서 내 조항을 문화체육관광부 표준계약서와 비교해
                다른 점을 보여주는 가이드 툴이며, 변호사의 법률 자문이나 대리를 대체하지 않습니다. AI가 제공하는
                모든 결과물은 참고용 정보이며 법적 효력이 없습니다. 최종 계약 체결 여부와 그에 따른 법적 책임은
                전적으로 사용자 본인에게 있으며, 중요한 계약은 반드시 변호사 등 법률 전문가와 상담 후 결정하시기
                바랍니다.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. 약관의 동의</h2>
              <p>레드라인AI(이하 &ldquo;본 서비스&rdquo;)에 접속하거나 이를 이용함으로써 귀하는 본 이용약관에 동의하는 것으로 간주됩니다. 본 약관에 동의하지 않으시는 경우 본 서비스를 이용하실 수 없습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. 서비스 설명</h2>
              <p>레드라인AI는 사용자가 계약서 등 법률 문서 내에서 표준계약서와 다른 조항을 파악할 수 있도록 돕는 AI 기반 계약서 비교 도구입니다. 본 서비스는 참고용 정보 제공을 목적으로 하며, 법률 자문에 해당하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. 법률 자문이 아님</h2>
              <p>레드라인AI는 법률사무소가 아니며 법률 자문을 제공하지 않습니다. 저희 AI가 생성하는 분석·비교 결과는 참고용 정보일 뿐입니다. 본 서비스의 결과물을 근거로 법적 판단을 내리기 전에 반드시 자격을 갖춘 변호사와 상담하시기 바랍니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. 회원 계정</h2>
              <p>귀하는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다. 계정이 무단으로 사용된 것을 인지한 경우 즉시 저희에게 알려야 합니다. 저희는 본 약관을 위반한 계정을 정지 또는 해지할 권리를 보유합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. 이용 수칙</h2>
              <p>귀하는 다음 행위를 하지 않을 것에 동의합니다:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-slate-400">
                <li>위법하거나 유해하거나 제3자의 권리를 침해하는 콘텐츠 업로드</li>
                <li>본 서비스를 리버스 엔지니어링하거나 우회하려는 시도</li>
                <li>본 서비스를 불법적인 목적으로 이용하는 행위</li>
                <li>본인의 계정 정보를 타인과 공유하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. 구독 및 결제</h2>
              <p>유료 요금제는 월 단위로 청구됩니다. 결제는 Paddle을 통해 안전하게 처리됩니다. 구독함으로써 귀하는 해지 시점까지 등록된 결제 수단으로 반복 청구되는 것에 동의하는 것으로 간주됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">7. 환불 정책</h2>
              <p>저희는 14일 환불 정책을 운영하고 있습니다. 자세한 내용은 <Link href="/refund" className="text-red-400 hover:text-red-300">환불 정책</Link>을 참고해 주세요.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">8. 지적재산권</h2>
              <p>본 서비스의 디자인, 기능, 콘텐츠를 포함한 일체는 Pactbug의 소유이며 지적재산권법의 보호를 받습니다. 귀하가 업로드한 문서의 소유권은 귀하에게 있으나, 본 서비스 제공 목적으로 이를 처리할 수 있는 제한된 라이선스를 저희에게 부여하는 것으로 간주됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">9. 보증의 부인</h2>
              <p>본 서비스는 어떠한 형태의 보증도 없이 &ldquo;있는 그대로&rdquo; 제공됩니다. 저희는 AI가 생성하는 분석·비교 결과의 정확성, 완전성, 신뢰성을 보증하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">10. 책임의 제한</h2>
              <p>관련 법령이 허용하는 최대한의 범위 내에서, Pactbug은 귀하의 본 서비스 이용으로 인해 발생하는 간접적, 부수적, 특별 또는 결과적 손해에 대해 책임을 지지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">11. 약관의 변경</h2>
              <p>저희는 언제든지 본 약관을 수정할 권리를 보유합니다. 중대한 변경 사항이 있는 경우 이메일 또는 서비스 내 공지를 통해 사용자에게 안내합니다. 변경 후 서비스를 계속 이용하는 경우 새로운 약관에 동의한 것으로 간주됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">12. 문의</h2>
              <p>본 약관에 대해 궁금하신 점은 <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>으로 문의해 주세요.</p>
            </section>
          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300">개인정보처리방침</Link>
          <Link href="/refund" className="hover:text-slate-300">환불 정책</Link>
          <Link href="/" className="hover:text-slate-300">홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
