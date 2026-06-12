// 장르별 추천 도서
const categoryBooks = {
  novel: ["아몬드", "불편한 편의점", "채식주의자", "나미야 잡화점의 기적", "아버지의 해방일지", "오늘 밤 세계에서 이 사랑이 사라진다 해도"],
  selfhelp: ["아주 작은 습관의 힘", "역행자", "미라클 모닝", "원씽", "그릿", "하루 1%의 기적"],
  economy: ["돈의 심리학", "부의 추월차선", "사장학개론", "불변의 법칙", "부자 아빠 가난한 아빠", "넛지"],
  science: ["사피엔스", "코스모스", "이기적 유전자", "총균쇠", "파인만의 여섯 가지 물리 이야기", "빅뱅 우주론 강의"]
};

$(document).ready(async function () {
  await loadCategoryBooks('novel');

  // 탭 클릭
  $('.category-tab').click(async function () {
    $('.category-tab').removeClass('active');
    $(this).addClass('active');
    await loadCategoryBooks($(this).data('category'));
  });

  // 히어로 검색
  $('#hero-search-btn').click(function () {
    const q = $('#hero-search-input').val().trim();
    if (q) window.location.href = `pages/search.html?q=${encodeURIComponent(q)}`;
  });

  $('#hero-search-input').keypress(function (e) {
    if (e.which === 13) $('#hero-search-btn').click();
  });

  // 카테고리 클릭
  $('.category-card').click(function () {
    window.location.href = `pages/search.html?q=${encodeURIComponent($(this).data('query'))}`;
  });
});

async function loadCategoryBooks(category) {
  $('#recommend-grid').html('<div class="loading">추천 도서를 불러오는 중...</div>');
  const results = [];
  for (const title of categoryBooks[category]) {
    const data = await searchBooks(title, 1, 1);
    if (data && data.documents.length > 0) results.push(data.documents[0]);
  }
  if (results.length > 0) {
    $('#recommend-grid').html(results.map(createBookCard).join(''));
  } else {
    $('#recommend-grid').html('<p class="loading">데이터를 불러올 수 없습니다.</p>');
  }
}
