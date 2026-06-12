$(document).ready(function () {
  renderAll();

  // 탭 전환
  $('.tab-btn').click(function () {
    $('.tab-btn').removeClass('active');
    $('.tab-content').removeClass('active');
    $(this).addClass('active');
    $(`#tab-${$(this).data('tab')}`).addClass('active');
  });
});

function renderAll() {
  renderStats();
  renderStatusBooks('reading', '#reading-grid');
  renderStatusBooks('done', '#done-grid');
  renderStatusBooks('want', '#want-grid');
  renderWishlist();
  renderMyReviews();
}

// 독서 통계
function renderStats() {
  const statusData = getReadingStatus();
  const wishlist = getWishlist();
  const reviews = getReviews();
  const statusList = Object.values(statusData);
  const doneCount = statusList.filter(s => s.status === 'done').length;
  const readingCount = statusList.filter(s => s.status === 'reading').length;
  const wantCount = statusList.filter(s => s.status === 'want').length;
  const totalReviews = Object.values(reviews).reduce((sum, arr) => sum + arr.length, 0);

  animateNumber('#stat-total', wishlist.length);
  animateNumber('#stat-done', doneCount);
  animateNumber('#stat-reading', readingCount);
  animateNumber('#stat-reviews', totalReviews);

  // 독서 현황 바 차트
  const maxCount = Math.max(doneCount, readingCount, wantCount, 1);
  const statusItems = [
    { label: '읽었어요', count: doneCount, color: '#4A90D9' },
    { label: '읽는 중', count: readingCount, color: '#F5A623' },
    { label: '읽고싶어요', count: wantCount, color: '#9B59B6' },
  ];

  $('#status-chart').html(statusItems.map(item => `
    <div class="bar-item">
      <span class="bar-label">${item.label}</span>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(item.count / maxCount * 100).toFixed(0)}" style="background: linear-gradient(90deg, ${item.color}, ${item.color}99)"></div>
      </div>
      <span style="font-size:14px; font-weight:700; color:var(--text); min-width:36px;">${item.count}권</span>
    </div>
  `).join(''));

  setTimeout(() => {
    $('.bar-fill').each(function () { $(this).css('width', $(this).data('width') + '%'); });
  }, 100);
}

function animateNumber(selector, target) {
  let current = 0;
  const step = Math.ceil(target / 20);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    $(selector).text(current);
    if (current >= target) clearInterval(interval);
  }, 40);
}

// 읽기 상태별 목록
function renderStatusBooks(status, gridSelector) {
  const books = Object.values(getReadingStatus())
    .filter(v => v.status === status)
    .map(v => v.book);

  if (books.length === 0) {
    $(gridSelector).html(`
      <div class="empty-library">
        <div class="emoji">📭</div>
        <p>아직 없어요. 책을 검색해서 추가해보세요!</p>
        <a href="search.html" class="btn btn-primary">책 검색하기</a>
      </div>
    `);
    return;
  }
  $(gridSelector).html(books.map(createBookCard).join(''));
}

// 찜 목록
function renderWishlist() {
  const list = getWishlist();
  if (list.length === 0) {
    $('#wish-grid').html(`
      <div class="empty-library">
        <div class="emoji">💔</div>
        <p>아직 찜한 책이 없어요!</p>
        <a href="search.html" class="btn btn-primary">책 검색하기</a>
      </div>
    `);
    return;
  }
  $('#wish-grid').html(list.map(createBookCard).join(''));
}

// 내 리뷰
function renderMyReviews() {
  const entries = Object.entries(getReviews());
  if (entries.length === 0) {
    $('#my-reviews').html(`
      <div class="empty-library">
        <div class="emoji">✏️</div>
        <p>아직 작성한 리뷰가 없어요!</p>
        <a href="search.html" class="btn btn-primary">책 검색하기</a>
      </div>
    `);
    return;
  }

  const html = entries.map(([isbn, reviews]) => reviews.map((r, i) => `
    <div class="review-item" style="margin-bottom:16px">
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        ${r.book && r.book.thumbnail
          ? `<img src="${r.book.thumbnail}" style="width:48px; height:64px; object-fit:cover; border-radius:4px">`
          : `<div style="width:48px; height:64px; background:var(--bg-light); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:20px">📚</div>`}
        <div>
          <p style="font-weight:600; font-size:14px; margin-bottom:4px">${r.book ? r.book.title : '책 정보 없음'}</p>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} ${r.rating}점</div>
        </div>
      </div>
      <p class="review-text">${r.text}</p>
      <span class="review-date">${r.date}</span>
      <button class="review-delete" onclick="handleDeleteMyReview('${isbn}', ${i})">🗑️</button>
    </div>
  `).join('')).join('');

  $('#my-reviews').html(html);
}

function handleDeleteMyReview(isbn, index) {
  showConfirm('리뷰 삭제', '작성한 리뷰를 삭제할까요?', function () {
    deleteReview(isbn, index);
    renderMyReviews();
    renderStats();
    showToast('리뷰를 삭제했어요');
  });
}
