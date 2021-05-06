interface NoteContent {
  linkText: string;
  url: string;
}

function getNote(noteContent: NoteContent, noteType: string) {
  return (
    <div className={`localized-content-note notecard inline ${noteType}`}>
      <a
        href={noteContent.url}
        className={!noteContent.url.startsWith("/") ? "external" : undefined}
      >
        {noteContent.linkText}
      </a>
    </div>
  );
}

export function LocalizedContentNote({
  isActive,
  locale,
  retiredLocale,
}: {
  isActive: boolean;
  locale: string;
  retiredLocale: boolean;
}) {
  const activeLocaleNoteContent = {
    "en-US": {
      linkText:
        "This page was translated from English by the community. Learn more and join the MDN Web Docs community.",
    },
    fr: {
      linkText:
        "Cette page a été traduite à partir de l'anglais par la communauté. Vous pouvez également contribuer en rejoignant la communauté francophone sur MDN Web Docs.",
    },
    ko: {
      linkText:
        "이 페이지는 영어로부터 커뮤니티에 의하여 번역되었습니다. MDN Web Docs에서 한국 커뮤니티에 가입하여 자세히 알아보세요.",
    },
  };
  const inactiveLocaleNoteContent = {
    de: {
      linkText:
        "Der Inhalt dieser Seite wurde von der Community übersetzt, jedoch wird er nicht mehr aktiv gepflegt und kann daher veraltet sein. Wenn du mithelfen möchtest, kannst du hier herausfinden wie deaktivierte Übersetzung reaktiviert werden.",
    },
    "en-US": {
      linkText:
        "This page was translated from English by the community, but it's not maintained and may be out-of-date. To help maintain it, learn how to activate locales.",
    },
    es: {
      linkText:
        "Esta página fue traducida del inglés por la comunidad, pero no se mantiene activamente, por lo que puede estar desactualizada. Si desea ayudar a mantenerlo, descubra cómo activar las configuraciones regionales inactivas.",
    },
  };

  const noteContent: NoteContent = {
    linkText: isActive
      ? activeLocaleNoteContent[locale].linkText ||
        activeLocaleNoteContent["en-US"].linkText
      : inactiveLocaleNoteContent[locale].linkText ||
        inactiveLocaleNoteContent["en-US"].linkText,
    url: isActive
      ? "/en-US/docs/MDN/Contribute/Localize#active_locales"
      : "https://github.com/mdn/translated-content#promoting-an-inactive-locale-to-tier-1",
  };
  const noteType = isActive ? "neutral" : "warning";

  if (retiredLocale) {
    noteContent.linkText =
      "The page you requested has been retired, so we've sent you to the English equivalent.";
    noteContent.url =
      "https://hacks.mozilla.org/2021/03/mdn-localization-in-march-tier-1-locales-unfrozen-and-future-plans/";
  }

  return getNote(noteContent, noteType);
}
