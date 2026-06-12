const KAKAO_API_KEY = '45ca65c7b02629e32de56a1e73512d93';

async function searchBooks(query, page = 1, size = 12, sort = 'accuracy') {
  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&page=${page}&size=${size}&sort=${sort}`;
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': 'KakaoAK ${KAKAO_API_KEY}' }
    });
    if (!response.ok) throw new Error('API 요청 실패');
    return await response.json();
  } catch (e) {
    console.error('검색 오류:', e);
    return null;
  }
}

// localStorage
function getWishlist() {
  return JSON.parse(localStorage.getItem('bookshelf_wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('bookshelf_wishlist', JSON.stringify(list));
}

function isInWishlist(isbn) {
  return getWishlist().some(b => b.isbn === isbn);
}

function toggleWishlist(book) {
  let list = getWishlist();
  const idx = list.findIndex(b => b.isbn === book.isbn);
  if (idx >= 0) {
    list.splice(idx, 1);
    showToast('찜 목록에서 제거했어요');
  } else {
    list.push(book);
    showToast('찜 목록에 추가했어요 ❤️');
  }
  saveWishlist(list);
  return idx < 0;
}

function getReadingStatus() {
  return JSON.parse(localStorage.getItem('bookshelf_status') || '{}');
}

function setReadingStatus(isbn, status, bookData) {
  const all = getReadingStatus();
  if (status === '') {
    delete all[isbn];
  } else {
    all[isbn] = { status, book: bookData, updatedAt: new Date().toISOString() };
  }
  localStorage.setItem('bookshelf_status', JSON.stringify(all));
}

function getReviews() {
  return JSON.parse(localStorage.getItem('bookshelf_reviews') || '{}');
}

function saveReview(isbn, rating, text, bookData) {
  const all = getReviews();
  if (!all[isbn]) all[isbn] = [];
  all[isbn].unshift({
    rating,
    text,
    date: new Date().toLocaleDateString('ko-KR'),
    book: bookData
  });
  localStorage.setItem('bookshelf_reviews', JSON.stringify(all));
}

function deleteReview(isbn, index) {
  const all = getReviews();
  if (all[isbn]) {
    all[isbn].splice(index, 1);
    if (all[isbn].length === 0) delete all[isbn];
  }
  localStorage.setItem('bookshelf_reviews', JSON.stringify(all));
}

// 책 카드
function createBookCard(book) {
  const isbn = book.isbn || book.title;
  const inWish = isInWishlist(isbn);
  const cover = book.thumbnail
    ? `<img class="book-cover" src="${book.thumbnail}" alt="${book.title}" loading="lazy">`
    : `<div class="book-cover-placeholder">📚</div>`;
  const price = book.sale_price > 0
    ? `${book.sale_price.toLocaleString()}원`
    : book.price > 0 ? `${book.price.toLocaleString()}원` : '가격 미정';

  return `
    <div class="book-card" onclick="goDetail('${encodeURIComponent(JSON.stringify(book))}')">
      ${cover}
      <button class="wishlist-btn ${inWish ? 'active' : ''}" 
        onclick="event.stopPropagation(); handleWishlist(this, ${JSON.stringify(book).replace(/"/g, '&quot;')})">
        ${inWish ? '❤️' : '🤍'}
      </button>
      <div class="book-info">
        <p class="book-title">${book.title}</p>
        <p class="book-author">${book.authors ? book.authors.join(', ') : '저자 미상'}</p>
        <p class="book-price">${price}</p>
      </div>
    </div>
  `;
}

function handleWishlist(btn, book) {
  const isbn = book.isbn || book.title;
  const added = toggleWishlist({ ...book, isbn });
  btn.innerHTML = added ? '❤️' : '🤍';
  btn.classList.toggle('active', added);
}

function goDetail(encoded) {
  localStorage.setItem('bookshelf_current', decodeURIComponent(encoded));
  const isInPages = window.location.pathname.includes('/pages/');
  window.location.href = isInPages ? 'detail.html' : 'pages/detail.html';
}

// 토스트
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, 2500);
}

// 햄버거 메뉴
$(document).ready(function () {
  $('#hamburger').click(function () {
    $('#nav-menu').toggleClass('open');
  });
});

// 삭제 확인 모달
function showConfirm(title, desc, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <p class="modal-title">${title}</p>
      <p class="modal-desc">${desc}</p>
      <div class="modal-actions">
        <button class="modal-cancel" id="modal-cancel">취소</button>
        <button class="modal-confirm" id="modal-confirm">삭제</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('modal-confirm').onclick = function () {
    document.body.removeChild(overlay);
    onConfirm();
  };
  document.getElementById('modal-cancel').onclick = function () {
    document.body.removeChild(overlay);
  };
  overlay.onclick = function (e) {
    if (e.target === overlay) document.body.removeChild(overlay);
  };
}
