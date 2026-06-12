let currentPage = 1;
let currentQuery = '';
let isEnd = false;

$(document).ready(async function () {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    $('#search-input').val(q);
    await doSearch(q);
  }

  // 검색
  $('#search-btn').click(function () {
    const q = $('#search-input').val().trim();
    if (q) doSearch(q);
  });

  $('#search-input').keypress(function (e) {
    if (e.which === 13) {
      const q = $(this).val().trim();
      if (q) doSearch(q);
    }
  });

  // 정렬/개수 변경
  $('#sort-select, #size-select').change(function () {
    if (currentQuery) doSearch(currentQuery);
  });

  // 더 보기
  $('#load-more').click(async function () {
    currentPage++;
    const data = await searchBooks(currentQuery, currentPage, parseInt($('#size-select').val()), $('#sort-select').val());
    if (data && data.documents.length > 0) {
      $('#result-grid').append(data.documents.map(createBookCard).join(''));
      isEnd = data.meta.is_end;
      if (isEnd) $('#load-more').hide();
    }
  });
});

async function doSearch(query) {
  currentQuery = query;
  currentPage = 1;
  $('#result-grid').html('<div class="loading">검색 중...</div>');
  $('#result-count').hide();
  $('#load-more').hide();

  const data = await searchBooks(query, 1, parseInt($('#size-select').val()), $('#sort-select').val());

  if (!data || data.documents.length === 0) {
    $('#result-grid').html(`
      <div class="no-result">
        <div class="emoji">😅</div>
        <p>"${query}"에 대한 검색 결과가 없어요</p>
      </div>
    `);
    return;
  }

  $('#result-count').html(`<span>${data.meta.pageable_count.toLocaleString()}</span>개의 검색 결과`).show();
  $('#result-grid').html(data.documents.map(createBookCard).join(''));
  isEnd = data.meta.is_end;
  if (!isEnd) $('#load-more').show();
  history.pushState(null, '', `?q=${encodeURIComponent(query)}`);
}
