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
    <div className="wiqaya-card" style={{ position: 'relative' }}>
      {/* Bookmark button */}
      <button
        className={`wiqaya-bookmark-btn${isBookmarked ? ' wiqaya-bookmarked' : ''}`}
        onClick={onBookmark}
        title={isBookmarked ? 'Bookmarked' : 'Bookmark this verse'}
        aria-label={isBookmarked ? 'Verse bookmarked' : 'Bookmark verse'}
      >
        {isBookmarked ? '♥' : '♡'}
      </button>

      {/* Ornamental header */}
      <div className="wiqaya-card-ornament">
        <div className="wiqaya-card-ornament-line" />
        <span className="wiqaya-card-ornament-symbol">۞</span>
        <div className="wiqaya-card-ornament-line" />
      </div>

      {/* Arabic text — the hero */}
      <p className="wiqaya-arabic" lang="ar">
        {verse.textUthmani}
      </p>

      <div className="wiqaya-divider" />

      {/* Verse reference */}
      <div className="wiqaya-reference">
        <span className="wiqaya-reference-arabic">{verse.chapterNameArabic}</span>
        {verse.chapterNameSimple} &mdash; {verse.chapterNumber}:{verse.verseNumber}
      </div>

      {/* Translation section */}
      {!translationRevealed ? (
        <button className="wiqaya-reveal-btn" onClick={onRevealTranslation}>
          <span className="wiqaya-reveal-btn-icon">✦</span>
          Reveal Translation
        </button>
      ) : (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <p className="wiqaya-translation">
            &ldquo;{verse.translationText}&rdquo;
          </p>
          <p className="wiqaya-translation-source">{verse.translationName}</p>
        </div>
      )}
    </div>
  )
}
