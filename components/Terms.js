
import React from 'react';

const Terms = ({ language }) => {
    const isArabic = language === 'ar';

    const Section = ({ title, children }) => (
        React.createElement('section', { className: "mb-6" },
            React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-3" }, title),
            React.createElement('div', { className: "space-y-3 text-slate-600 dark:text-brand-text-light leading-relaxed" }, children)
        )
    );

    const en = {
        title: "Terms and Conditions",
        lastUpdated: "Last Updated: July 26, 2024",
        sections: [
            {
                title: "1. Introduction",
                content: [
                    "Welcome to PM Roadmap ('we', 'us', or 'our'). These Terms and Conditions govern your use of our website and services (collectively, the 'Service'). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service."
                ]
            },
            {
                title: "2. User Accounts",
                content: [
                    "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.",
                    "You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party."
                ]
            },
            {
                title: "3. Content",
                content: [
                    "Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ('Content'). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.",
                    "By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. We do not claim ownership of your Content."
                ]
            },
            {
                title: "4. Prohibited Activities",
                content: [
                    "You agree not to use the Service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts; to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances; to infringe upon or violate our intellectual property rights or the intellectual property rights of others."
                ]
            },
            {
                title: "5. Intellectual Property",
                content: [
                    "The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of PM Roadmap and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries."
                ]
            },
            {
                title: "6. Termination",
                content: [
                    "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.",
                    "Upon termination, your right to use the Service will immediately cease."
                ]
            },
            {
                title: "7. Disclaimer of Warranties; Limitation of Liability",
                content: [
                    "The service is provided on an 'AS IS' and 'AS AVAILABLE' basis. We do not warrant that the results of using the service will be accurate or reliable.",
                    "In no case shall PM Roadmap, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind."
                ]
            },
            {
                title: "8. Governing Law",
                content: [
                    "These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions."
                ]
            },
            {
                title: "9. Changes to Terms",
                content: [
                    "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms."
                ]
            },
            {
                title: "10. Contact Us",
                content: [
                    "If you have any questions about these Terms, please contact us at info@roadmap.casa."
                ]
            }
        ]
    };
    
    const ar = {
        title: "الشروط والأحكام",
        lastUpdated: "آخر تحديث: 26 يوليو 2024",
        sections: [
            {
                title: "1. مقدمة",
                content: [
                    "أهلاً بك في 'خارطة طريق المشروع' (المشار إليه بـ 'نحن' أو 'لنا'). تحكم هذه الشروط والأحكام استخدامك لموقعنا وخدماتنا (يشار إليها مجتمعة بـ 'الخدمة'). من خلال الوصول إلى الخدمة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء من الشروط، فلا يجوز لك الوصول إلى الخدمة."
                ]
            },
            {
                title: "2. حسابات المستخدمين",
                content: [
                    "عند إنشاء حساب معنا، يجب عليك تقديم معلومات دقيقة وكاملة وحديثة في جميع الأوقات. يشكل عدم القيام بذلك خرقًا للشروط، مما قد يؤدي إلى الإنهاء الفوري لحسابك على خدمتنا.",
                    "أنت مسؤول عن حماية كلمة المرور التي تستخدمها للوصول إلى الخدمة وعن أي أنشطة أو إجراءات تتم بموجب كلمة المرور الخاصة بك. أنت توافق على عدم الكشف عن كلمة المرور الخاصة بك لأي طرف ثالث."
                ]
            },
            {
                title: "3. المحتوى",
                content: [
                    "تسمح لك خدمتنا بنشر وربط وتخزين ومشاركة وإتاحة معلومات أو نصوص أو رسومات أو مواد أخرى معينة ('المحتوى'). أنت مسؤول عن المحتوى الذي تنشره على الخدمة، بما في ذلك قانونيته وموثوقيته وملاءمته.",
                    "من خلال نشر المحتوى على الخدمة، فإنك تمنحنا الحق والترخيص لاستخدام وتعديل وأداء وعرض وتوزيع هذا المحتوى على ومن خلال الخدمة. نحن لا ندعي ملكية المحتوى الخاص بك."
                ]
            },
            {
                title: "4. الأنشطة المحظورة",
                content: [
                    "أنت توافق على عدم استخدام الخدمة لأي غرض غير قانوني أو لحث الآخرين على أداء أو المشاركة في أي أعمال غير قانونية؛ لانتهاك أي لوائح أو قواعد أو قوانين أو مراسيم دولية أو اتحادية أو إقليمية أو محلية؛ للتعدي على حقوق الملكية الفكرية الخاصة بنا أو حقوق الملكية الفكرية للآخرين."
                ]
            },
            {
                title: "5. الملكية الفكرية",
                content: [
                    "الخدمة ومحتواها الأصلي (باستثناء المحتوى المقدم من قبل المستخدمين) والميزات والوظائف هي وستبقى ملكية حصرية لـ 'خارطة طريق المشروع' ومرخصيه. الخدمة محمية بموجب حقوق النشر والعلامات التجارية والقوانين الأخرى في كل من الولايات المتحدة والدول الأجنبية."
                ]
            },
            {
                title: "6. الإنهاء",
                content: [
                    "يجوز لنا إنهاء أو تعليق حسابك على الفور، دون إشعار مسبق أو مسؤولية، لأي سبب من الأسباب، بما في ذلك على سبيل المثال لا الحصر إذا قمت بخرق الشروط.",
                    "عند الإنهاء، سيتوقف حقك في استخدام الخدمة على الفور."
                ]
            },
            {
                title: "7. إخلاء المسؤولية عن الضمانات؛ تحديد المسؤولية",
                content: [
                    "يتم توفير الخدمة على أساس 'كما هي' و 'كما هي متاحة'. نحن لا نضمن أن نتائج استخدام الخدمة ستكون دقيقة أو موثوقة.",
                    "لا يتحمل 'خارطة طريق المشروع' أو مديرونا أو موظفونا أو الشركات التابعة لنا أو وكلائنا أو مقاولونا أو متدربونا أو موردونا أو مقدمو الخدمات أو المرخصون بأي حال من الأحوال المسؤولية عن أي إصابة أو خسارة أو مطالبة أو أي أضرار مباشرة أو غير مباشرة أو عرضية أو تأديبية أو خاصة أو تبعية من أي نوع."
                ]
            },
            {
                title: "8. القانون الحاكم",
                content: [
                    "تخضع هذه الشروط وتفسر وفقًا لقوانين الولاية القضائية التي تأسست فيها شركتنا، بغض النظر عن تعارضها مع أحكام القانون."
                ]
            },
            {
                title: "9. التغييرات على الشروط",
                content: [
                    "نحن نحتفظ بالحق، وفقًا لتقديرنا الخاص، في تعديل أو استبدال هذه الشروط في أي وقت. سنقدم إشعارًا قبل 30 يومًا على الأقل من سريان أي شروط جديدة. من خلال الاستمرار في الوصول إلى خدمتنا أو استخدامها بعد أن تصبح هذه المراجعات سارية المفعول، فإنك توافق على الالتزام بالشروط المعدلة."
                ]
            },
            {
                title: "10. اتصل بنا",
                content: [
                    "إذا كان لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا على info@roadmap.casa."
                ]
            }
        ]
    };

    const content = isArabic ? ar : en;

    return React.createElement('div', { className: "max-w-4xl mx-auto py-16 px-4" },
        React.createElement('div', { className: "text-center mb-10" },
            React.createElement('h1', { className: "text-4xl font-extrabold text-slate-900 dark:text-brand-text" }, content.title),
            React.createElement('p', { className: "text-sm text-slate-500 dark:text-brand-text-light" }, content.lastUpdated)
        ),
        React.createElement('div', { className: "bg-white dark:bg-card-gradient p-8 rounded-2xl border border-slate-200 dark:border-white/10" },
            content.sections.map((section, index) =>
                React.createElement(Section, { key: index, title: section.title },
                    section.content.map((p, pIndex) => React.createElement('p', { key: pIndex }, p))
                )
            )
        )
    );
};

export default Terms;