
import React from 'react';

const Privacy = ({ language }) => {
    const isArabic = language === 'ar';

    const Section = ({ title, children }) => (
        React.createElement('section', { className: "mb-6" },
            React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-3" }, title),
            React.createElement('div', { className: "space-y-3 text-slate-600 dark:text-brand-text-light leading-relaxed" }, children)
        )
    );

    const en = {
        title: "Data Security & Privacy Policy",
        lastUpdated: "Last Updated: July 26, 2024",
        sections: [
            {
                title: "1. Introduction",
                content: [
                    "PM Roadmap ('we', 'us', or 'our') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site."
                ]
            },
            {
                title: "2. Information We Collect",
                content: [
                    "We may collect information about you in a variety of ways. The information we may collect on the Site includes:",
                    React.createElement('ul', { className: 'list-disc list-inside space-y-2 pl-4' },
                        React.createElement('li', null, React.createElement('strong', null, 'Personal Data: '), "Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Site."),
                        React.createElement('li', null, React.createElement('strong', null, 'Usage Data: '), "Information that your browser sends whenever you visit our Service. This may include your computer's IP address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, and other diagnostic data."),
                        React.createElement('li', null, React.createElement('strong', null, 'User Content: '), "We collect the project data, files and content you upload to our services to provide you with the features of the application, such as AI Planning and Risk Analysis.")
                    )
                ]
            },
            {
                title: "3. How We Use Your Information",
                content: [
                    "Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:",
                    React.createElement('ul', { className: 'list-disc list-inside space-y-2 pl-4' },
                        React.createElement('li', null, "Create and manage your account."),
                        React.createElement('li', null, "Provide, operate, and maintain our services."),
                        React.createElement('li', null, "Improve, personalize, and expand our services."),
                        React.createElement('li', null, "Understand and analyze how you use our services."),
                        React.createElement('li', null, "Communicate with you for customer service, to provide you with updates and other information relating to the website.")
                    )
                ]
            },
            {
                title: "4. Disclosure of Your Information",
                content: [
                    "We do not share, sell, rent, or trade user information with third parties for their commercial purposes. We may share information we have collected about you in certain situations, such as with third-party service providers who perform services for us or on our behalf, including data analysis, hosting services, and customer service."
                ]
            },
            {
                title: "5. Data Security",
                content: [
                    "We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse."
                ]
            },
            {
                title: "6. Your Data Protection Rights",
                content: [
                    "Depending on your location, you may have the following rights regarding your personal information: the right to access, the right to rectification, the right to erasure, the right to restrict processing, and the right to data portability. You can manage your account information by logging into your account settings."
                ]
            },
            {
                title: "7. Children's Privacy",
                content: [
                    "Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13."
                ]
            },
            {
                title: "8. Changes to This Privacy Policy",
                content: [
                    "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes."
                ]
            },
            {
                title: "9. Contact Us",
                content: [
                    "If you have any questions about this Privacy Policy, please contact us at info@roadmap.casa."
                ]
            }
        ]
    };

    const ar = {
        title: "سياسة أمان وخصوصية البيانات",
        lastUpdated: "آخر تحديث: 26 يوليو 2024",
        sections: [
            {
                title: "1. مقدمة",
                content: [
                    "تلتزم 'خارطة طريق المشروع' ('نحن' أو 'لنا') بحماية خصوصيتك. تشرح سياسة الخصوصية هذه كيف نجمع معلوماتك ونستخدمها ونكشف عنها ونحميها عند استخدامك لخدمتنا. يرجى قراءة سياسة الخصوصية هذه بعناية. إذا كنت لا توافق على شروط سياسة الخصوصية هذه، فيرجى عدم الوصول إلى الموقع."
                ]
            },
            {
                title: "2. المعلومات التي نجمعها",
                content: [
                    "قد نجمع معلومات عنك بعدة طرق. تتضمن المعلومات التي قد نجمعها على الموقع ما يلي:",
                    React.createElement('ul', { className: 'list-disc list-inside space-y-2 pr-4' },
                        React.createElement('li', null, React.createElement('strong', null, 'البيانات الشخصية: '), "المعلومات التعريفية الشخصية، مثل اسمك وعنوان بريدك الإلكتروني، التي تقدمها لنا طواعية عند التسجيل في الموقع."),
                        React.createElement('li', null, React.createElement('strong', null, 'بيانات الاستخدام: '), "المعلومات التي يرسلها متصفحك كلما قمت بزيارة خدمتنا. قد يشمل ذلك عنوان IP لجهاز الكمبيوتر الخاص بك، ونوع المتصفح، وإصدار المتصفح، وصفحات خدمتنا التي تزورها، ووقت وتاريخ زيارتك، وبيانات تشخيصية أخرى."),
                        React.createElement('li', null, React.createElement('strong', null, 'محتوى المستخدم: '), "نجمع بيانات المشروع والملفات والمحتوى الذي تقوم بتحميله إلى خدماتنا لتزويدك بميزات التطبيق، مثل التخطيط الذكي وتحليل المخاطر.")
                    )
                ]
            },
            {
                title: "3. كيف نستخدم معلوماتك",
                content: [
                    "إن وجود معلومات دقيقة عنك يسمح لنا بتزويدك بتجربة سلسة وفعالة ومخصصة. على وجه التحديد، قد نستخدم المعلومات التي تم جمعها عنك عبر الموقع من أجل:",
                    React.createElement('ul', { className: 'list-disc list-inside space-y-2 pr-4' },
                        React.createElement('li', null, "إنشاء وإدارة حسابك."),
                        React.createElement('li', null, "توفير وتشغيل وصيانة خدماتنا."),
                        React.createElement('li', null, "تحسين وتخصيص وتوسيع خدماتنا."),
                        React.createElement('li', null, "فهم وتحليل كيفية استخدامك لخدماتنا."),
                        React.createElement('li', null, "التواصل معك لخدمة العملاء، وتزويدك بالتحديثات والمعلومات الأخرى المتعلقة بالموقع.")
                    )
                ]
            },
            {
                title: "4. الكشف عن معلوماتك",
                content: [
                    "نحن لا نشارك أو نبيع أو نؤجر أو نتاجر بمعلومات المستخدم مع أطراف ثالثة لأغراضهم التجارية. قد نشارك المعلومات التي جمعناها عنك في مواقف معينة، مثل مع مزودي الخدمات من الأطراف الثالثة الذين يؤدون خدمات لنا أو نيابة عنا، بما في ذلك تحليل البيانات وخدمات الاستضافة وخدمة العملاء."
                ]
            },
            {
                title: "5. أمن البيانات",
                content: [
                    "نحن نستخدم تدابير أمنية إدارية وفنية ومادية للمساعدة في حماية معلوماتك الشخصية. بينما اتخذنا خطوات معقولة لتأمين المعلومات الشخصية التي تقدمها لنا، يرجى العلم أنه على الرغم من جهودنا، لا توجد تدابير أمنية مثالية أو لا يمكن اختراقها، ولا يمكن ضمان أي طريقة لنقل البيانات ضد أي اعتراض أو أي نوع آخر من سوء الاستخدام."
                ]
            },
            {
                title: "6. حقوق حماية البيانات الخاصة بك",
                content: [
                    "اعتمادًا على موقعك، قد يكون لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية: الحق في الوصول، والحق في التصحيح، والحق في المسح، والحق في تقييد المعالجة، والحق في نقل البيانات. يمكنك إدارة معلومات حسابك عن طريق تسجيل الدخول إلى إعدادات حسابك."
                ]
            },
            {
                title: "7. خصوصية الأطفال",
                content: [
                    "خدمتنا لا تخاطب أي شخص دون سن 13 عامًا. نحن لا نجمع عن عمد معلومات تعريفية شخصية من أي شخص دون سن 13 عامًا."
                ]
            },
            {
                title: "8. التغييرات على سياسة الخصوصية هذه",
                content: [
                    "قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة. ننصحك بمراجعة سياسة الخصوصية هذه بشكل دوري لأي تغييرات."
                ]
            },
            {
                title: "9. اتصل بنا",
                content: [
                    "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على info@roadmap.casa."
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
                    section.content.map((p, pIndex) => React.createElement('div', { key: pIndex }, p))
                )
            )
        )
    );
};

export default Privacy;