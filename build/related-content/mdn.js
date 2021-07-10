const { setActive, setTitleFromURL, setURLFromSlug } = require("./utils");

// This is a pure Node port of the `macros/MDNSidebar.ejs` macro.

// This could be memoized.
// But note that if you do that, we're afterwards computing and setting `.isActive`
// based on its output so you'd have to deep-clone the output of this function first.
// At this point, all the deep cloning is probably just overheads that aren't
// worth it.
const getRelatedByLocale = (locale) => {
  const baseURL = `/${locale}/docs/MDN`;
  // XXX TODO: Make it be a list of Slugs instead! Then let Yari figure out
  // what the titles should be.
  const text = {
    "en-US": {
      About_MDN: "About MDN",
      MDN_guide_for_readers: "MDN guide for readers",
      Promote_MDN: "Promote MDN",
      Send_feedback_about_MDN: "Send feedback about MDN",
      Get_started_on_MDN: "Get started on MDN",
      Contributing_to_MDN: "Contributing to MDN",
      Other_things_you_can_do: "Things you can do",
      Localizing_MDN: "Localizing MDN",
      MDN_editor_UI: "MDN editor UI",
      Tools_for_power_users: "Tools for power users",
      Guidelines: "Guidelines",
      Work_processes: "Work processes",
      Content_structures: "Content structures",
    },
    ar: {
      About_MDN: "حول شبكة مطوري موزيل",
      MDN_guide_for_readers: "دليل قراء الشبكة",
      Promote_MDN: "انشر الشبكة",
      Send_feedback_about_MDN: "ارسل تعليقاتك حول الشبكة",
      Get_started_on_MDN: "ابدأ مع شبكة مطوري موزيل",
      Contributing_to_MDN: "ساعد على تحسين شبكة مطوري موزيلا",
      Other_things_you_can_do: "أشياء يمكنك القيام بها",
      Localizing_MDN: "ترجم الشبكة إلى لغتك",
      MDN_editor_UI: "واجهة محرر الشبكة",
      Tools_for_power_users: "أدوات لمساعدة المستخدمين",
      Guidelines: "دلائل إرشادية",
      Work_processes: "سير العمل",
      Content_structures: "هياكل المحتوى",
    },
    ca: {
      About_MDN: "Sobre MDN",
      Promote_MDN: "Promoure MDN",
      Send_feedback_about_MDN: "Enviar comentaris sobre MDN",
      Get_started_on_MDN: "Començar en MDN",
      Contributing_to_MDN: "Ajuda a millora MDN",
      Other_things_you_can_do: "Coses que pot fer",
      Localizing_MDN: "Localització de MDN",
      Tools_for_power_users: "Eines per usuaris avançats",
      Guidelines: "Guies",
      Work_processes: "Processos de treball",
      Content_structures: "Estructures de contingut",
    },
    de: {
      About_MDN: "Über MDN",
      Promote_MDN: "Fördere MDN",
      Send_feedback_about_MDN: "Bewerte MDN",
      Get_started_on_MDN: "Erste Schritte auf MDN",
      Contributing_to_MDN: "Beitragen zu MDN",
      Other_things_you_can_do: "How-to Leitfäden",
      Localizing_MDN: "Lokalisieren von MDN",
      MDN_editor_UI: "Editoren Anleitung",
      Tools_for_power_users: "Werkzeuge für Fortgeschrittene",
      Guidelines: "Richtlinien",
      Work_processes: "Arbeitsweisen",
      Content_structures: "Inhalststruktur",
    },
    es: {
      About_MDN: "Acerca de MDN",
      MDN_guide_for_readers: "MDN reader's guide(inglés)",
      Promote_MDN: "Promueve MDN",
      Send_feedback_about_MDN: "Enviar feedback sobre MDN",
      Get_started_on_MDN: "Primeros pasos en MDN",
      Contributing_to_MDN: "Ayudar a la MDN",
      Other_things_you_can_do: "Cosas que puedes hacer",
      Localizing_MDN: "Adaptar/traducir MDN",
      MDN_editor_UI: "Interfaz del editor de MDN",
      Tools_for_power_users: "Herramientas para usuarios avanzados",
      Guidelines: "Guías de preferencias",
      Work_processes: "Procesos de documentacion",
      Content_structures: "Estructura del contenido",
    },
    fr: {
      About_MDN: "À propos",
      MDN_guide_for_readers: "Aides à la lecture de MDN",
      Promote_MDN: "Promotion de MDN",
      Send_feedback_about_MDN: "Faire un retour sur MDN",
      Get_started_on_MDN: "Débuter sur MDN",
      Contributing_to_MDN: "Contribuer au MDN",
      Other_things_you_can_do: 'Guides "Comment faire"',
      Localizing_MDN: "Localiser MDN",
      MDN_editor_UI: "Interface de l'éditeur de MDN",
      Tools_for_power_users: "Outils pour les utilisateurs avancés",
      Guidelines: "Guides du style et du contenu MDN",
      Work_processes: "Processus de documentation",
      Content_structures: "Structures des contenus",
    },
    "hi-IN": {
      About_MDN: "MDN के बारे में",
      MDN_guide_for_readers: "MDN पाठक की मार्गदर्शिका",
      Promote_MDN: "MDN का प्रचार करें",
      Send_feedback_about_MDN: "MDN के बारे में प्रतिक्रिया भेजें",
      Get_started_on_MDN: "MDN पर शुरू करें",
      Contributing_to_MDN: "MDN में सुधार करने में मदद करें",
      Other_things_you_can_do: "चीज़ें जो आप कर सकते हों",
      Localizing_MDN: "MDN का स्थानीयकरण करें ",
      Tools_for_power_users: "Power उपयोगकर्ताओं के लिए उपकरण",
      Guidelines: "दिशा निर्देश",
      Work_processes: "कार्य प्रक्रियाएं",
      Content_structures: "सामग्री संरचनाएं",
    },
    hu: {
      About_MDN: "Az MDN-ről",
      Promote_MDN: "Az MDN népszerűsítése",
      Send_feedback_about_MDN: "Visszajelzés küldése az MDN-ről",
      Get_started_on_MDN: "Ismerkedés az MDN-nel",
      Contributing_to_MDN: "Segítsen az MDN tökéletesítésében",
      Other_things_you_can_do: "Dolgok, amiket megtehet",
      Localizing_MDN: "Az MDN honosítása",
      MDN_editor_UI: "MDN szerkesztőfelület",
      Tools_for_power_users: "Eszközök tapasztalt felhasználóknak",
      Guidelines: "Irányelvek",
      Work_processes: "Munkafolyamatok",
      Content_structures: "Tartalom felépítése",
    },
    id: {
      About_MDN: "Tentang MDN",
      Promote_MDN: "Promosikan MDN",
      Send_feedback_about_MDN: "Kirim feedback tentang MDN",
      Get_started_on_MDN: "Memulai di MDN",
      Contributing_to_MDN: "Bantu kembangkan MDN",
      Other_things_you_can_do: "Hal yang anda bisa lakukan",
      Localizing_MDN: "Melokalisasi MDN",
      Guidelines: "Paduan",
      Content_structures: "Struktur konten",
    },
    it: {
      About_MDN: "Informazioni su MDN",
      Promote_MDN: "Promuovi MDN",
      Get_started_on_MDN: "Primi passi su MDN",
      Contributing_to_MDN: "Contribuire a MDN",
      Other_things_you_can_do: "Guide come fare per",
      Localizing_MDN: "Localizzazione di MDN",
      MDN_editor_UI: "Guida all'editor di MDN",
    },
    ja: {
      About_MDN: "MDN について",
      MDN_guide_for_readers: "MDN 読者のガイド",
      Promote_MDN: "MDN を宣伝する",
      Send_feedback_about_MDN: "MDNについてのフィードバックを送る",
      Get_started_on_MDN: "MDN を始めよう",
      Contributing_to_MDN: "MDN の改善に貢献する",
      Other_things_you_can_do: "あなたにできること",
      Localizing_MDN: "MDN でのローカライズ",
      MDN_editor_UI: "MDNエディターガイド",
      Tools_for_power_users: "パワーユーザーのためのツール",
      Work_processes: "作業のプロセス",
      Content_structures: "文書の構造",
    },
    ko: {
      About_MDN: "MDN이란",
      MDN_guide_for_readers: "MDN 독자를 위한 가이드",
      Promote_MDN: "MDN 홍보하기",
      Send_feedback_about_MDN: "MDN에 피드백을 보내주세요!",
      Get_started_on_MDN: "MDN 시작하기",
      Contributing_to_MDN: "MDN 참여하기",
      Other_things_you_can_do: "MDN web docs 사용방법",
      Localizing_MDN: "MDN 지역화 하기",
      MDN_editor_UI: "MDN 에디터 UI 가이드",
      Tools_for_power_users: "파워 유저를 위한 도구들",
      Guidelines: "가이드라인",
      Work_processes: "작업 진행 과정",
      Content_structures: "문서 구조",
    },
    nl: {
      About_MDN: "Over MDN",
      MDN_guide_for_readers: "Lezersgids voor MDN",
      Promote_MDN: "MDN promoten",
      Send_feedback_about_MDN: "Feedback versturen over MDN",
      Get_started_on_MDN: "Beginnen op MDN",
      Contributing_to_MDN: "Bijdragen aan MDN",
      Other_things_you_can_do: "Dingen die u kunt doen",
      Localizing_MDN: "MDN lokaliseren",
      MDN_editor_UI: "Editor-UI van MDN",
      Tools_for_power_users: "Hulpmiddelen voor hoofdgebruikers",
      Guidelines: "Richtlijnen",
      Work_processes: "Werkprocessen",
      Content_structures: "Inhoudsstructuren",
    },
    "pt-BR": {
      About_MDN: "Sobre a MDN",
      Promote_MDN: "Promover a MDN",
      Send_feedback_about_MDN: "Enviar feedback sobre a MDN",
      Get_started_on_MDN: "Primeiros passos na MDN",
      Contributing_to_MDN: "Ajudar a melhorar a MDN",
      Other_things_you_can_do: "O que pode fazer",
      Localizing_MDN: "Localizando a MDN",
      MDN_editor_UI: "Editor UI MDN",
      Tools_for_power_users: "Ferramentas para usuários avançados",
      Guidelines: "Diretrizes",
      Work_processes: "Processos de trabalho",
      Content_structures: "Estruturas de conteúdo",
    },
    "pt-PT": {
      About_MDN: "Sobre a MDN",
      Send_feedback_about_MDN: "Enviar opinião sobre a MDN",
      Get_started_on_MDN: "Iniciação na MDN",
      Contributing_to_MDN: "Contribuir para a MDN",
      Other_things_you_can_do: "Guias de Como...",
      Localizing_MDN: "Localizar MDN",
      MDN_editor_UI: "Guia para o editor da IU da MDN",
      Guidelines: "Linhas Diretrizes",
    },
    ro: {
      About_MDN: "Despre MDN",
      Get_started_on_MDN: "Noțiuni de bază despre MDN",
    },
    ru: {
      About_MDN: "О MDN",
      Promote_MDN: "Продвижение MDN",
      Send_feedback_about_MDN: "Оставить отзыв о MDN",
      Get_started_on_MDN: "MDN - Быстрый старт!",
      Contributing_to_MDN: "Сотрудничество с MDN",
      Other_things_you_can_do: 'Руководства "Как сделать"',
      Localizing_MDN: "Локализация MDN",
      MDN_editor_UI: "Руководство редактора MDN",
      Tools_for_power_users: "Инструменты для активных пользователей",
      Guidelines: "Руководства",
      Work_processes: "Рабочие процессы",
      Content_structures: "Структуры документов",
    },
    "sv-SE": {
      About_MDN: "Om MDN",
      Promote_MDN: "Marknadsför MDN",
      Send_feedback_about_MDN: "Skicka in feedback om MDN",
      Contributing_to_MDN: "Hjälp till att förbättra MDN",
      Other_things_you_can_do: "Saker som du kan göra",
      Guidelines: "Riktlinjer",
      Work_processes: "Arbetsprocedurer",
      Content_structures: "Innehållsstrukturer",
    },
    uk: {
      About_MDN: "Про MDN",
      Promote_MDN: "Поширити MDN",
      Send_feedback_about_MDN: "Залишити відгук про MDN",
      Get_started_on_MDN: "Швидкий старт на MDN",
      Contributing_to_MDN: "Допомогти вдосконалити MDN",
      Other_things_you_can_do: "Що можна зробити",
      Localizing_MDN: "Переклад MDN",
      MDN_editor_UI: "Посібник редактора MDN",
      Tools_for_power_users: "Інструменти для просунутих користувачів",
      Guidelines: "Посібники",
      Work_processes: "Робочі процеси",
      Content_structures: "Структури документів",
    },
    vi: {
      About_MDN: "Giới Thiệu Về MDN",
      MDN_editor_UI: "Hướng dẫn trình soạn thảo MDN",
    },
    "zh-CN": {
      About_MDN: "关于 MDN",
      Promote_MDN: "推广MDN",
      Get_started_on_MDN: "初识MDN",
      Contributing_to_MDN: "为 MDN 做贡献",
      Other_things_you_can_do: "MDN 使用指南",
      Localizing_MDN: "MDN 本地化",
      MDN_editor_UI: "MDN 编辑指南",
      Tools_for_power_users: "MDN 工具",
      Content_structures: "文档结构",
    },
    "zh-TW": {
      About_MDN: "關於 MDN",
      Promote_MDN: "推廣 MDN",
      Get_started_on_MDN: "開始入門 MDN",
      Contributing_to_MDN: "貢獻 MDN",
      Guidelines: "MDN 內容與風格指南",
    },
  };

  function getText(key) {
    const strings = text[locale] || text["en-US"];
    return strings[key] || text["en-US"][key];
  }

  const related = [];
  related.push({
    title: getText("About_MDN"),
    slug: "About",
    content: [
      {
        title: getText("Contributing_to_MDN"),
        content: [
          {
            title: getText("Get_started_on_MDN"),
            slug: "Contribute/Getting_started",
          },
          {
            title: getText("Contributing_to_MDN"),
            slug: "Contribute",
          },
          {
            title: getText("Other_things_you_can_do"),
            slug: "Contribute/Howto",
          },
          {
            title: getText("Localizing_MDN"),
            slug: "Contribute/Localize",
          },
          { title: getText("Guidelines"), slug: "Guidelines" },
          {
            title: getText("Content_structures"),
            slug: "Structures",
          },
        ],
      },
    ],
  });

  setURLFromSlug(related, baseURL);
  setTitleFromURL(related, locale);

  return related;
};

function getRelatedContent(doc) {
  const { locale, mdn_url } = doc;
  // First get it purely dependent on the locale
  const related = getRelatedByLocale(locale);
  // Now we can inject which page we're currently on based on the doc.
  setActive(related, mdn_url);
  return related;
}
module.exports = getRelatedContent;
