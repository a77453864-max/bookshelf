let currentBook = null;
let selectedRating = 0;

$(document).ready(function () {
  const stored = localStorage.getItem('bookshelf_current');
  if (!stored) { window.location.href = 'search.html'; return; }
  currentBook = JSON.parse(stored);
  renderDetail(currentBook);
  renderReviews(currentBook.isbn || currentBook.title);
});

function renderDetail(book) {
  const isbn = book.isbn || book.title;
  const inWish = isInWishlist(isbn);
  const statusData = getReadingStatus();
  const currentStatus = statusData[isbn] ? statusData[isbn].status : '';

  const cover = book.thumbnail
    ? `<img class="detail-cover" src="${book.thumbnail}" alt="${book.title}">`
    : `<div class="detail-cover-placeholder">📚</div>`;

  const price = book.sale_price > 0
    ? `${book.sale_price.toLocaleString()}원`
    : book.price > 0 ? `${book.price.toLocaleString()}원` : '가격 미정';

  const contentsText = book.contents ? book.contents.trimEnd() + (book.contents.length >= 199 ? '...' : '') : '';
  const descHtml = contentsText ? `
    <div class="detail-description">
      <h3>책 소개</h3>
      <p id="desc-text" style="display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; line-height:1.8;">${contentsText}</p>
      <button onclick="toggleDesc()" id="desc-toggle" style="margin-top:10px; background:none; border:none; color:var(--primary); cursor:pointer; font-size:13px; font-weight:600;">더 보기 ▼</button>
    </div>` : '';

  $('#detail-content').html(`
    <div class="detail-layout">
      <div>${cover}</div>
      <div>
        <h1 class="detail-title">${book.title}</h1>
        <p class="detail-author">${book.authors ? book.authors.join(', ') : '저자 미상'}</p>
        <div class="detail-meta">
          ${book.publisher ? `<span class="meta-tag">📌 ${book.publisher}</span>` : ''}
          ${book.datetime ? `<span class="meta-tag">📅 ${book.datetime.substring(0, 10)}</span>` : ''}
          ${book.isbn ? `<span class="meta-tag">ISBN: ${book.isbn}</span>` : ''}
        </div>
        <p class="detail-price">${price}</p>
        <div class="detail-actions">
          <button id="wish-btn" class="btn ${inWish ? 'btn-accent' : 'btn-outline'}" onclick="handleWishBtn()">
            ${inWish ? '❤️ 찜 해제' : '🤍 찜하기'}
          </button>
          <select id="status-select" class="status-select" onchange="handleStatusChange(this.value)">
            <option value="">📚 읽기 상태 선택</option>
            <option value="reading" ${currentStatus === 'reading' ? 'selected' : ''}>📖 읽는 중</option>
            <option value="done" ${currentStatus === 'done' ? 'selected' : ''}>✅ 읽었어요</option>
            <option value="want" ${currentStatus === 'want' ? 'selected' : ''}>🔖 읽고 싶어요</option>
          </select>
          ${book.url ? `<a href="${book.url}" target="_blank" class="btn btn-primary">구매하기 →</a>` : ''}
        </div>
        ${descHtml}
      </div>
    </div>

    <div class="review-section" style="margin-top:40px">
      <h3>⭐ 별점 & 리뷰</h3>
      <div class="star-rating" id="star-rating">
        <span class="star" data-val="1" onclick="setRating(1)">★</span>
        <span class="star" data-val="2" onclick="setRating(2)">★</span>
        <span class="star" data-val="3" onclick="setRating(3)">★</span>
        <span class="star" data-val="4" onclick="setRating(4)">★</span>
        <span class="star" data-val="5" onclick="setRating(5)">★</span>
      </div>
      <p id="rating-label" style="font-size:13px; color:var(--text-muted); margin-bottom:12px">별점을 선택해주세요</p>
      <textarea id="review-input" class="review-input" placeholder="이 책에 대한 감상을 남겨보세요..."></textarea>
      <button class="btn btn-primary" onclick="submitReview()">리뷰 등록</button>
      <div class="review-list" id="review-list"></div>
    </div>
  `);

  $('.star').hover(
    function () {
      const val = $(this).data('val');
      $('.star').each(function () { $(this).toggleClass('active', $(this).data('val') <= val); });
    },
    function () { updateStarDisplay(selectedRating); }
  );
}

// 더보기/접기
function toggleDesc() {
  const p = document.getElementById('desc-text');
  const btn = document.getElementById('desc-toggle');
  if (p.style.webkitLineClamp === '3') {
    p.style.webkitLineClamp = 'unset';
    p.style.overflow = 'visible';
    p.style.display = 'block';
    btn.textContent = '접기 ▲';
  } else {
    p.style.display = '-webkit-box';
    p.style.webkitLineClamp = '3';
    p.style.webkitBoxOrient = 'vertical';
    p.style.overflow = 'hidden';
    btn.textContent = '더 보기 ▼';
  }
}

function handleWishBtn() {
  const isbn = currentBook.isbn || currentBook.title;
  const added = toggleWishlist({ ...currentBook, isbn });
  $('#wish-btn').html(added ? '❤️ 찜 해제' : '🤍 찜하기');
  $('#wish-btn').toggleClass('btn-accent', added).toggleClass('btn-outline', !added);
}

function handleStatusChange(status) {
  const isbn = currentBook.isbn || currentBook.title;
  setReadingStatus(isbn, status, currentBook);
  const labels = { reading: '읽는 중으로 등록했어요 📖', done: '읽은 책으로 등록했어요 ✅', want: '읽고 싶은 책으로 등록했어요 🔖', '': '읽기 상태를 해제했어요' };
  showToast(labels[status] || '');
}

// 별점
function setRating(val) {
  selectedRating = val;
  updateStarDisplay(val);
  const labels = ['', '별로예요', '그저 그래요', '보통이에요', '좋아요', '최고예요!'];
  $('#rating-label').text(`${val}점 - ${labels[val]}`);
}

function updateStarDisplay(val) {
  $('.star').each(function () { $(this).toggleClass('active', $(this).data('val') <= val); });
}

function submitReview() {
  if (selectedRating === 0) { showToast('별점을 먼저 선택해주세요!'); return; }
  const text = $('#review-input').val().trim();
  if (!text) { showToast('리뷰 내용을 입력해주세요!'); return; }
  const isbn = currentBook.isbn || currentBook.title;
  saveReview(isbn, selectedRating, text, currentBook);
  $('#review-input').val('');
  selectedRating = 0;
  updateStarDisplay(0);
  $('#rating-label').text('별점을 선택해주세요');
  showToast('리뷰가 등록됐어요! ⭐');
  renderReviews(isbn);
}

// 리뷰 목록
function renderReviews(isbn) {
  const reviews = getReviews()[isbn] || [];
  const list = $('#review-list');
  if (reviews.length === 0) {
    list.html('<p style="color:var(--text-muted); font-size:14px; text-align:center; padding:20px 0;">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>');
    return;
  }
  list.html(reviews.map((r, i) => `
    <div class="review-item">
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} ${r.rating}점</div>
      <p class="review-text">${r.text}</p>
      <span class="review-date">${r.date}</span>
      <button class="review-delete" onclick="handleDeleteReview('${isbn}', ${i})">🗑️</button>
    </div>
  `).join(''));
}

function handleDeleteReview(isbn, index) {
  showConfirm('리뷰 삭제', '작성한 리뷰를 삭제할까요?', function () {
    deleteReview(isbn, index);
    renderReviews(isbn);
    showToast('리뷰를 삭제했어요');
  });
}
