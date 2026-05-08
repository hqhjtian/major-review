const STORAGE_KEY = "majorReviewV1";

let blocks = [];
let currentIndex = 0;
let currentFilter = "all";
let isContentHidden = false;

// 车轮复习相关
let reviewMode = false;
let reviewQueue = [];
let completedChapterNotified = [];

const sourceText = document.getElementById("sourceText");
const parseBtn = document.getElementById("parseBtn");
const clearBtn = document.getElementById("clearBtn");

const treeView = document.getElementById("treeView");
const emptyState = document.getElementById("emptyState");
const cardArea = document.getElementById("cardArea");

const totalCount = document.getElementById("totalCount");
const masteredCount = document.getElementById("masteredCount");
const fuzzyCount = document.getElementById("fuzzyCount");
const unknownCount = document.getElementById("unknownCount");

const cardIndex = document.getElementById("cardIndex");
const cardStatus = document.getElementById("cardStatus");
const cardTitle = document.getElementById("cardTitle");
const cardPath = document.getElementById("cardPath");
const cardContent = document.getElementById("cardContent");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const markMastered = document.getElementById("markMastered");
const markFuzzy = document.getElementById("markFuzzy");
const markUnknown = document.getElementById("markUnknown");
const reviewChapterBtn = document.getElementById("reviewChapterBtn");
const chapterReview = document.getElementById("chapterReview");

const filterAll = document.getElementById("filterAll");
const filterUnknown = document.getElementById("filterUnknown");
const filterFuzzy = document.getElementById("filterFuzzy");
const filterMastered = document.getElementById("filterMastered");
const filterNone = document.getElementById("filterNone");

const toggleAnswerBtn = document.getElementById("toggleAnswerBtn");

const generateReviewBtn = document.getElementById("generateReviewBtn");
const exitReviewBtn = document.getElementById("exitReviewBtn");
const reviewSummary = document.getElementById("reviewSummary");
const refreshProgressBtn = document.getElementById("refreshProgressBtn");
const jumpWeakestBtn = document.getElementById("jumpWeakestBtn");
const overallProgress = document.getElementById("overallProgress");
const weakList = document.getElementById("weakList");
const chapterStats = document.getElementById("chapterStats");
const chapterCompleteBox = document.getElementById("chapterCompleteBox");
const chapterCompleteTitle = document.getElementById("chapterCompleteTitle");
const chapterCompleteStats = document.getElementById("chapterCompleteStats");
const showCompletedChapterBtn = document.getElementById("showCompletedChapterBtn");
const closeCompletedChapterBtn = document.getElementById("closeCompletedChapterBtn");
const promptChoiceBtn = document.getElementById("promptChoiceBtn");
const promptBlankBtn = document.getElementById("promptBlankBtn");
const promptShortBtn = document.getElementById("promptShortBtn");
const promptMixedBtn = document.getElementById("promptMixedBtn");
const promptOutput = document.getElementById("promptOutput");
const copyPromptBtn = document.getElementById("copyPromptBtn");

const scoreInput = document.getElementById("scoreInput");
const applyScoreBtn = document.getElementById("applyScoreBtn");
const scoreHint = document.getElementById("scoreHint");
parseBtn.addEventListener("click", () => {
  const text = sourceText.value.trim();
  if (!text) {
    alert("请先粘贴复习资料。");
    return;
  }

  blocks = parseStudyText(text);
  currentIndex = 0;
  currentFilter = "all";
  isContentHidden = false;
  reviewMode = false;
  reviewQueue = [];
    completedChapterNotified = [];

  if (blocks.length === 0) {
    alert("没有识别到有效板块。请检查标题格式。");
    return;
  }

  saveData();
  renderAll();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("确定清空全部资料和学习记录吗？")) return;

  blocks = [];
  currentIndex = 0;
  currentFilter = "all";
  isContentHidden = false;
  reviewMode = false;
  reviewQueue = [];
    completedChapterNotified = [];
  sourceText.value = "";
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
});

prevBtn.addEventListener("click", () => {
  const visible = getVisibleBlocks();
  const visibleCurrentIndex = visible.findIndex(item => item.realIndex === currentIndex);

  if (visibleCurrentIndex > 0) {
    currentIndex = visible[visibleCurrentIndex - 1].realIndex;
    isContentHidden = false;
    saveData();
    renderAll();
  }
});

nextBtn.addEventListener("click", () => {
  const visible = getVisibleBlocks();
  const visibleCurrentIndex = visible.findIndex(item => item.realIndex === currentIndex);

  if (visibleCurrentIndex < visible.length - 1) {
    currentIndex = visible[visibleCurrentIndex + 1].realIndex;
    isContentHidden = false;
    saveData();
    renderAll();
  }
});

markMastered.addEventListener("click", () => markCurrent("mastered"));
markFuzzy.addEventListener("click", () => markCurrent("fuzzy"));
markUnknown.addEventListener("click", () => markCurrent("unknown"));

filterAll.addEventListener("click", () => setFilter("all"));
filterUnknown.addEventListener("click", () => setFilter("unknown"));
filterFuzzy.addEventListener("click", () => setFilter("fuzzy"));
filterMastered.addEventListener("click", () => setFilter("mastered"));
filterNone.addEventListener("click", () => setFilter("none"));

toggleAnswerBtn.addEventListener("click", () => {
  isContentHidden = !isContentHidden;
  renderCard();
});

generateReviewBtn.addEventListener("click", () => {
  generateReviewQueue();
});

exitReviewBtn.addEventListener("click", () => {
  reviewMode = false;
  reviewQueue = [];
  currentFilter = "all";
  isContentHidden = false;
  saveData();
  renderAll();
});
refreshProgressBtn.addEventListener("click", () => {
  renderProgressPanel();
});

jumpWeakestBtn.addEventListener("click", () => {
  const weakest = getWeakestBlockIndex();

  if (weakest === null) {
    alert("目前没有标记为“不会”或“模糊”的板块。");
    return;
  }

  reviewMode = false;
  reviewQueue = [];
  currentFilter = "all";
  currentIndex = weakest;
  isContentHidden = false;
  saveData();
  renderAll();
});
showCompletedChapterBtn.addEventListener("click", () => {
  showCurrentChapterReview();
  chapterCompleteBox.classList.add("hidden");
});

closeCompletedChapterBtn.addEventListener("click", () => {
  chapterCompleteBox.classList.add("hidden");
});
promptChoiceBtn.addEventListener("click", () => {
  generatePrompt("choice");
});

promptBlankBtn.addEventListener("click", () => {
  generatePrompt("blank");
});

promptShortBtn.addEventListener("click", () => {
  generatePrompt("short");
});

promptMixedBtn.addEventListener("click", () => {
  generatePrompt("mixed");
});

copyPromptBtn.addEventListener("click", async () => {
  const text = promptOutput.value.trim();

  if (!text) {
    alert("还没有可复制的 Prompt。");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Prompt 已复制。");
  } catch (error) {
    promptOutput.select();
    document.execCommand("copy");
    alert("Prompt 已复制。");
  }
});

applyScoreBtn.addEventListener("click", () => {
  applyScoreToCurrentBlock();
});
reviewChapterBtn.addEventListener("click", () => {
  if (chapterReview.classList.contains("hidden")) {
    showCurrentChapterReview();
  } else {
    if (!chapterReview.dataset.keepOpen) {
  chapterReview.classList.add("hidden");
}
  }
});
function setFilter(filter) {
  reviewMode = false;
  reviewQueue = [];
  currentFilter = filter;

  const visible = getVisibleBlocks();

  if (visible.length > 0) {
    currentIndex = visible[0].realIndex;
  }

  isContentHidden = false;
  saveData();
  renderAll();
}

function generateReviewQueue() {
  if (blocks.length === 0) {
    alert("请先解析复习资料。");
    return;
  }

  const unknown = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.status === "unknown");

  const fuzzy = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.status === "fuzzy");

  const mastered = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.status === "mastered");

  const none = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.status === "none");

  const fuzzyPicked = pickRandom(fuzzy, Math.ceil(fuzzy.length * 0.6));
  const masteredPicked = pickRandom(mastered, Math.ceil(mastered.length * 0.2));
  const nonePicked = pickRandom(none, Math.ceil(none.length * 0.25));

  const queue = [
    ...unknown,
    ...fuzzyPicked,
    ...masteredPicked,
    ...nonePicked
  ];

  if (queue.length === 0) {
    alert("目前没有可生成复习队列的板块。你可以先标记一些不会、模糊或掌握。");
    return;
  }

  reviewQueue = shuffle(queue.map(item => item.realIndex));
  reviewMode = true;
  currentFilter = "all";
  currentIndex = reviewQueue[0];
  isContentHidden = true;

  saveData();
  renderAll();
}

function pickRandom(items, count) {
  if (count <= 0) return [];
  return shuffle([...items]).slice(0, Math.min(count, items.length));
}

function shuffle(items) {
  return items.sort(() => Math.random() - 0.5);
}

function getVisibleBlocks() {
  if (reviewMode) {
    return reviewQueue
      .filter(index => blocks[index])
      .map(index => ({
        block: blocks[index],
        realIndex: index
      }));
  }

  return blocks
    .map((block, index) => ({
      block,
      realIndex: index
    }))
    .filter(item => {
      if (currentFilter === "all") return true;
      if (currentFilter === "none") return item.block.status === "none";
      return item.block.status === currentFilter;
    });
}

function markCurrent(status) {
  if (!blocks[currentIndex]) return;

  blocks[currentIndex].status = status;

  const completedChapterTitle = checkCurrentChapterCompleted();

  saveData();
  renderAll();

  if (completedChapterTitle) {
    showChapterCompletePrompt(completedChapterTitle);
  }
}

function parseStudyText(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const result = [];
  const path = [];
  let currentBlock = null;

  for (const line of lines) {
    const heading = detectHeading(line);

    if (heading) {
      if (currentBlock && currentBlock.content.trim()) {
        result.push(currentBlock);
      }

      path[heading.level - 1] = heading.title;
      path.length = heading.level;

      currentBlock = {
        id: createId(),
        title: heading.title,
        level: heading.level,
        path: [...path],
        content: "",
        status: "none"
      };
    } else {
      if (!currentBlock) {
        currentBlock = {
          id: createId(),
          title: "未归类内容",
          level: 1,
          path: ["未归类内容"],
          content: "",
          status: "none"
        };
      }

      currentBlock.content += line + "\n";
    }
  }

  if (currentBlock && currentBlock.content.trim()) {
    result.push(currentBlock);
  }

  return result;
}

function detectHeading(line) {
  const patterns = [
    // 一级：章、节、篇、部分、编
    {
      level: 1,
      regex: /^(第[一二三四五六七八九十百千万\d]+[章节篇部分编].*)$/
    },

    // 二级：一、二、三、
    {
      level: 2,
      regex: /^([一二三四五六七八九十]+、.+)$/
    },

    // 三级：（一）（二）（三）
    {
      level: 3,
      regex: /^(（[一二三四五六七八九十]+）.+)$/
    },

    // 四级：1. / 1、 / 1．
    {
      level: 4,
      regex: /^(\d+[、.．]\s*.+)$/
    },

    // 五级：（1）（2）（3）
    {
      level: 5,
      regex: /^(（\d+）.+)$/
    },

    // 五级：①②③
    {
      level: 5,
      regex: /^([①②③④⑤⑥⑦⑧⑨⑩].+)$/
    },

    // Markdown 标题
    {
      level: 1,
      regex: /^(#{1}\s+.+)$/
    },
    {
      level: 2,
      regex: /^(#{2}\s+.+)$/
    },
    {
      level: 3,
      regex: /^(#{3}\s+.+)$/
    },
    {
      level: 4,
      regex: /^(#{4}\s+.+)$/
    }
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) {
      return {
        level: pattern.level,
        title: cleanHeading(match[1])
      };
    }
  }

  return null;
}

function cleanHeading(title) {
  return title.replace(/^#{1,3}\s*/, "").trim();
}

function createId() {
  return "block_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function renderAll() {
  renderStats();
  renderFilterButtons();
  renderReviewSummary();
  renderTree();
  renderCard();
  renderProgressPanel();
}

function renderStats() {
  totalCount.textContent = blocks.length;
  masteredCount.textContent = blocks.filter(b => b.status === "mastered").length;
  fuzzyCount.textContent = blocks.filter(b => b.status === "fuzzy").length;
  unknownCount.textContent = blocks.filter(b => b.status === "unknown").length;
}
function renderProgressPanel() {
  if (blocks.length === 0) {
    overallProgress.className = "overall-progress empty";
    overallProgress.textContent = "解析资料并标记掌握程度后，这里会显示整体进度。";

    weakList.className = "weak-list empty";
    weakList.textContent = "暂无薄弱清单。";

    chapterStats.className = "chapter-stats empty";
    chapterStats.textContent = "暂无章节统计。";
    return;
  }

  const overall = calculateStats(blocks);
  const overallRate = Math.round(overall.mastered / overall.total * 100);

  overallProgress.className = "overall-progress";
  overallProgress.innerHTML = `
    <div class="progress-card ${getProgressClass(overallRate, overall.unknown)}">
      <div class="progress-title">整体进度</div>
      <div class="progress-line">
        总板块：${overall.total}；
        掌握：${overall.mastered}；
        模糊：${overall.fuzzy}；
        不会：${overall.unknown}；
        未标记：${overall.none}；
        掌握率：${overallRate}%
      </div>
      <div class="progress-bar">
        <div class="progress-bar-inner" style="width: ${overallRate}%"></div>
      </div>
    </div>
  `;

  renderWeakList();
  renderChapterStats();
}

function renderWeakList() {
  const weakBlocks = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.status === "unknown" || item.block.status === "fuzzy")
    .sort((a, b) => {
      const scoreA = getWeakScore(a.block);
      const scoreB = getWeakScore(b.block);
      return scoreB - scoreA;
    });

  if (weakBlocks.length === 0) {
    weakList.className = "weak-list empty";
    weakList.textContent = "目前没有“不会”或“模糊”的板块。";
    return;
  }

  weakList.className = "weak-list";
  weakList.innerHTML = "";

  weakBlocks.slice(0, 12).forEach((item, order) => {
    const block = item.block;
    const div = document.createElement("div");
    div.className = `progress-card weak-item ${block.status === "unknown" ? "danger" : "warning"}`;

    div.innerHTML = `
      <div class="progress-title">
        ${order + 1}. ${getStatusIcon(block.status)} ${block.title}
      </div>
      <div class="progress-line">${block.path.join(" > ")}</div>
    `;

    div.addEventListener("click", () => {
      reviewMode = false;
      reviewQueue = [];
      currentFilter = "all";
      currentIndex = item.realIndex;
      isContentHidden = false;
      saveData();
      renderAll();
    });

    weakList.appendChild(div);
  });
}

function renderChapterStats() {
  const groups = groupByTopTitle();

  if (groups.length === 0) {
    chapterStats.className = "chapter-stats empty";
    chapterStats.textContent = "暂无章节统计。";
    return;
  }

  chapterStats.className = "chapter-stats";
  chapterStats.innerHTML = "";

  groups.forEach(group => {
    const stats = calculateStats(group.blocks);
    const rate = Math.round(stats.mastered / stats.total * 100);

    const div = document.createElement("div");
    div.className = `progress-card ${getProgressClass(rate, stats.unknown)}`;

    div.innerHTML = `
      <div class="progress-title">${group.title}</div>
      <div class="progress-line">
        总板块：${stats.total}；
        掌握：${stats.mastered}；
        模糊：${stats.fuzzy}；
        不会：${stats.unknown}；
        未标记：${stats.none}；
        掌握率：${rate}%
      </div>
      <div class="progress-bar">
        <div class="progress-bar-inner" style="width: ${rate}%"></div>
      </div>
    `;

    chapterStats.appendChild(div);
  });
}

function groupByTopTitle() {
  const map = new Map();

  blocks.forEach(block => {
    const topTitle = block.path[0] || "未归类内容";

    if (!map.has(topTitle)) {
      map.set(topTitle, []);
    }

    map.get(topTitle).push(block);
  });

  return Array.from(map.entries()).map(([title, chapterBlocks]) => ({
    title,
    blocks: chapterBlocks
  }));
}

function calculateStats(list) {
  return {
    total: list.length,
    mastered: list.filter(b => b.status === "mastered").length,
    fuzzy: list.filter(b => b.status === "fuzzy").length,
    unknown: list.filter(b => b.status === "unknown").length,
    none: list.filter(b => b.status === "none").length
  };
}

function getProgressClass(masteredRate, unknownCount) {
  if (unknownCount > 0 || masteredRate < 40) return "danger";
  if (masteredRate < 75) return "warning";
  return "safe";
}

function getWeakScore(block) {
  if (block.status === "unknown") return 2;
  if (block.status === "fuzzy") return 1;
  return 0;
}

function getWeakestBlockIndex() {
  const unknownIndex = blocks.findIndex(block => block.status === "unknown");
  if (unknownIndex !== -1) return unknownIndex;

  const fuzzyIndex = blocks.findIndex(block => block.status === "fuzzy");
  if (fuzzyIndex !== -1) return fuzzyIndex;

  return null;
}
function checkCurrentChapterCompleted() {
  const current = blocks[currentIndex];
  if (!current) return null;

  const topTitle = current.path[0];
  if (!topTitle) return null;

  const chapterBlocks = blocks.filter(block => block.path[0] === topTitle);

  const allMarked = chapterBlocks.length > 0 && chapterBlocks.every(block => {
    return block.status === "mastered" || block.status === "fuzzy" || block.status === "unknown";
  });

  if (!allMarked) return null;

  if (completedChapterNotified.includes(topTitle)) return null;

  completedChapterNotified.push(topTitle);
  return topTitle;
}

function showChapterCompletePrompt(topTitle) {
  const chapterBlocks = blocks.filter(block => block.path[0] === topTitle);
  const stats = calculateStats(chapterBlocks);
  const masteredRate = Math.round(stats.mastered / stats.total * 100);

  chapterCompleteTitle.textContent = `已完成：${topTitle}`;

  chapterCompleteStats.innerHTML = `
    <div>
      这一大标题下共有 <strong>${stats.total}</strong> 个板块。
      其中掌握 <strong>${stats.mastered}</strong> 个，
      模糊 <strong>${stats.fuzzy}</strong> 个，
      不会 <strong>${stats.unknown}</strong> 个。
      当前掌握率为 <strong>${masteredRate}%</strong>。
    </div>
    <div>建议现在进行一次整章回顾，把刚才拆散学习的内容重新合成整体。</div>
  `;

  chapterCompleteBox.classList.remove("hidden");
}

function showCurrentChapterReview() {
  if (!blocks[currentIndex]) return;

  const current = blocks[currentIndex];
  const topTitle = current.path[0];

  const sameChapterBlocks = blocks.filter(block => block.path[0] === topTitle);
  const stats = calculateStats(sameChapterBlocks);
  const masteredRate = Math.round(stats.mastered / stats.total * 100);

  const reviewText = sameChapterBlocks.map(block => {
    return `【${block.path.join(" > ")}】
状态：${getStatusText(block.status)}
${block.content}`;
  }).join("\n\n");

  chapterReview.textContent =
    `当前大标题完整回顾：${topTitle}\n` +
    `总板块：${stats.total}；掌握：${stats.mastered}；模糊：${stats.fuzzy}；不会：${stats.unknown}；未标记：${stats.none}；掌握率：${masteredRate}%\n\n` +
    reviewText;

  chapterReview.classList.remove("hidden");
}

function renderFilterButtons() {
  const buttons = [
    { element: filterAll, filter: "all" },
    { element: filterUnknown, filter: "unknown" },
    { element: filterFuzzy, filter: "fuzzy" },
    { element: filterMastered, filter: "mastered" },
    { element: filterNone, filter: "none" }
  ];

  buttons.forEach(item => {
    item.element.classList.toggle("active-filter", !reviewMode && currentFilter === item.filter);
  });
}

function renderReviewSummary() {
  if (!reviewMode || reviewQueue.length === 0) {
    reviewSummary.classList.add("hidden");
    reviewSummary.textContent = "";
    return;
  }

  const queueBlocks = reviewQueue.map(index => blocks[index]).filter(Boolean);

  const unknownCountInQueue = queueBlocks.filter(b => b.status === "unknown").length;
  const fuzzyCountInQueue = queueBlocks.filter(b => b.status === "fuzzy").length;
  const masteredCountInQueue = queueBlocks.filter(b => b.status === "mastered").length;
  const noneCountInQueue = queueBlocks.filter(b => b.status === "none").length;

  reviewSummary.classList.remove("hidden");
  reviewSummary.textContent =
    `当前处于车轮复习模式：共 ${queueBlocks.length} 个板块。\n` +
    `不会：${unknownCountInQueue} 个；模糊：${fuzzyCountInQueue} 个；掌握抽查：${masteredCountInQueue} 个；未标记抽查：${noneCountInQueue} 个。`;
}

function renderTree() {
  const visible = getVisibleBlocks();

  if (blocks.length === 0) {
    treeView.className = "tree empty";
    treeView.textContent = "解析后会在这里显示目录。";
    return;
  }

  if (visible.length === 0) {
    treeView.className = "tree empty";
    treeView.textContent = "当前筛选条件下没有板块。";
    return;
  }

  treeView.className = reviewMode ? "tree review-mode" : "tree";
  treeView.innerHTML = "";

  visible.forEach(item => {
    const block = item.block;
    const realIndex = item.realIndex;

    const treeItem = document.createElement("div");
    treeItem.className = `tree-item tree-level-${Math.min(block.level, 5)}`;
    if (realIndex === currentIndex) treeItem.classList.add("active");

    const statusIcon = getStatusIcon(block.status);
    treeItem.textContent = `${statusIcon} ${block.path.join(" > ")}`;

    treeItem.addEventListener("click", () => {
      currentIndex = realIndex;
      isContentHidden = false;
      saveData();
      renderAll();
    });

    treeView.appendChild(treeItem);
  });
}

function renderCard() {
  const visible = getVisibleBlocks();

  if (blocks.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "还没有学习内容。请先在左侧粘贴资料并点击“解析资料”。";
    cardArea.classList.add("hidden");
    return;
  }

  if (visible.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "当前筛选条件下没有学习内容。";
    cardArea.classList.add("hidden");
    return;
  }

  const currentInVisible = visible.some(item => item.realIndex === currentIndex);
  if (!currentInVisible) {
    currentIndex = visible[0].realIndex;
  }

  emptyState.classList.add("hidden");
  cardArea.classList.remove("hidden");
  if (!chapterReview.dataset.keepOpen) {
  chapterReview.classList.add("hidden");
}

  const block = blocks[currentIndex];
  const visiblePosition = visible.findIndex(item => item.realIndex === currentIndex);

  const prefix = reviewMode ? "复习队列 " : "";
  cardIndex.textContent = `${prefix}${visiblePosition + 1} / ${visible.length}`;
  cardTitle.textContent = block.title;
  cardPath.textContent = block.path.join(" > ");
  cardContent.textContent = block.content.trim() || "这个标题下暂时没有正文内容。";

  cardContent.classList.toggle("masked", isContentHidden);
  toggleAnswerBtn.textContent = isContentHidden ? "显示内容" : "隐藏内容，先背诵";

  cardStatus.className = `status ${block.status}`;
  cardStatus.textContent = getStatusText(block.status);
}

function getStatusText(status) {
  if (status === "mastered") return "掌握";
  if (status === "fuzzy") return "模糊";
  if (status === "unknown") return "不会";
  return "未标记";
}

function getStatusIcon(status) {
  if (status === "mastered") return "✅";
  if (status === "fuzzy") return "🟡";
  if (status === "unknown") return "🔴";
  return "⚪";
}

function saveData() {
  const data = {
    sourceText: sourceText.value,
    blocks,
    currentIndex,
    currentFilter,
    reviewMode,
    reviewQueue,
    completedChapterNotified
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    sourceText.value = data.sourceText || "";
    blocks = data.blocks || [];
    currentIndex = data.currentIndex || 0;
    currentFilter = data.currentFilter || "all";
    reviewMode = data.reviewMode || false;
    reviewQueue = data.reviewQueue || [];
    completedChapterNotified = data.completedChapterNotified || [];
  } catch (error) {
    console.error("读取本地记录失败：", error);
  }
}
function generatePrompt(type) {
  if (!blocks[currentIndex]) {
    alert("当前没有学习板块。");
    return;
  }

  const block = blocks[currentIndex];
  const pathText = block.path.join(" > ");
  const contentText = block.content.trim();

  if (!contentText) {
    alert("当前板块没有正文内容，无法生成 Prompt。");
    return;
  }

  let taskText = "";

  if (type === "choice") {
    taskText = `
请基于下面的专业课知识点，生成 5 道大学本科期末考试难度的单项选择题。

要求：
1. 每题 4 个选项，只有 1 个正确答案。
2. 难度接近普通本科心理学/教育学/专业课期末闭卷考试。
3. 不要只考机械背诵，要包含概念辨析、易混点、理解应用。
4. 每题给出正确答案、解析和考查知识点。
5. 干扰项要有迷惑性，但不能故意错误或超纲。
`;
  }

  if (type === "blank") {
    taskText = `
请基于下面的专业课知识点，生成 8 道大学本科期末考试难度的填空题。

要求：
1. 重点考查核心概念、关键词、分类、代表人物、理论关系。
2. 空格设置要符合期末考试常见考法，不要过度机械。
3. 给出标准答案。
4. 对容易混淆的地方给出简短提示。
`;
  }

  if (type === "short") {
    taskText = `
请基于下面的专业课知识点，生成 3 道大学本科期末考试难度的简答题。

要求：
1. 题目符合期末笔试风格。
2. 每道题给出参考答案。
3. 参考答案要适合背诵，结构清晰，分点表达。
4. 如果涉及概念、特点、功能、意义、区别，请优先考查。
5. 标出每道题的答题关键词。
`;
  }

  if (type === "mixed") {
    taskText = `
请基于下面的专业课知识点，生成一组大学本科期末考试风格的综合自测题。

题型包括：
1. 单项选择题 5 道；
2. 填空题 5 道；
3. 判断题 5 道；
4. 名词解释 2 道；
5. 简答题 2 道。

要求：
1. 难度接近期末闭卷考试。
2. 覆盖核心概念、易混点、理解应用和主观题表达。
3. 所有题目都要给出答案和解析。
4. 主观题答案要写成可背诵版本。
5. 最后给出“这个知识点应该重点背什么”的复习建议。
`;
  }

  const finalPrompt = `${taskText}

【知识点位置】
${pathText}

【知识点原文】
${contentText}

【输出格式】
请按以下结构输出：
一、题目
二、答案
三、解析
四、期末复习建议

【限制】
1. 主要依据我提供的知识点出题。
2. 不要编造与原文无关的内容。
3. 如果需要补充背景知识，请明确标注“补充理解”。
4. 出题难度定位为大学本科期末考试，不要太简单，也不要研究生考试化。`;

  promptOutput.value = finalPrompt.trim();
}

function applyScoreToCurrentBlock() {
  if (!blocks[currentIndex]) {
    alert("当前没有学习板块。");
    return;
  }

  const rawScore = scoreInput.value.trim();

  if (rawScore === "") {
    alert("请先输入正确率。");
    return;
  }

  const score = Number(rawScore);

  if (Number.isNaN(score) || score < 0 || score > 100) {
    alert("请输入 0 到 100 之间的数字。");
    return;
  }

  let newStatus = "unknown";
  let message = "";

  if (score >= 80) {
    newStatus = "mastered";
    message = `正确率 ${score}%：已自动标记为“掌握”。`;
  } else if (score >= 50) {
    newStatus = "fuzzy";
    message = `正确率 ${score}%：已自动标记为“模糊”。`;
  } else {
    newStatus = "unknown";
    message = `正确率 ${score}%：已自动标记为“不会”。`;
  }

  blocks[currentIndex].status = newStatus;
  scoreHint.textContent = message;

  saveData();
  renderAll();
}
loadData();
renderAll();