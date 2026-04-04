import type { VerseData } from '../shared/types'

interface Props {
  verse: VerseData
  translationRevealed: boolean
  onRevealTranslation: () => void
  isBookmarked: boolean
  onBookmark: () => void
}

export default function AyahCard({
  verse,
  translationRevealed,
  onRevealTranslation,
  isBookmarked,
  onBookmark,
}: Props) {
  return (
    /* Animated border wrapper */
    <div className="wiqaya-card-border">
      <div className="wiqaya-card">

        <div className="wiqaya-corner wiqaya-corner-tl" />
        <div className="wiqaya-corner wiqaya-corner-tr" />
        <div className="wiqaya-corner wiqaya-corner-bl" />
        <div className="wiqaya-corner wiqaya-corner-br" />

        <button
          className={`wiqaya-bookmark-btn${isBookmarked ? ' wiqaya-bookmarked' : ''}`}
          onClick={onBookmark}
          title={isBookmarked ? 'Bookmarked' : 'Bookmark this verse'}
          aria-label={isBookmarked ? 'Verse bookmarked' : 'Bookmark verse'}
        >
          {isBookmarked ? '♥' : '♡'}
        </button>

        <div className="wiqaya-card-ornament">
          <div className="wiqaya-card-ornament-line" />
          <div className="wiqaya-card-ornament-center">
            <div className="wiqaya-card-ornament-diamond" />
            <span className="wiqaya-card-ornament-symbol">۞</span>
            <div className="wiqaya-card-ornament-diamond" />
          </div>
          <div className="wiqaya-card-ornament-line" />
        </div>

        <p className="wiqaya-arabic" lang="ar">
          {verse.textUthmani}
        </p>

        <div className="wiqaya-divider" />

        <div className="wiqaya-reference">
          <span className="wiqaya-reference-arabic">{verse.chapterNameArabic}</span>
          <span className="wiqaya-reference-badge">
            {verse.chapterNameSimple}
            <span className="wiqaya-reference-dot" />
            {verse.chapterNumber}:{verse.verseNumber}
          </span>
        </div>

        {!translationRevealed ? (
          <button className="wiqaya-reveal-btn" onClick={onRevealTranslation}>
            <span className="wiqaya-reveal-btn-icon">✦</span>
            Reveal Translation
          </button>
        ) : (
          <div className="wiqaya-translation-wrapper">
            <p className="wiqaya-translation">
              &ldquo;{verse.translationText}&rdquo;
            </p>
            <p className="wiqaya-translation-source">{verse.translationName}</p>
          </div>
        )}
      </div>
    </div>
  )
}
