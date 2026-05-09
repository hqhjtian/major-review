// ==================== 常量定义 ====================
const STORAGE_KEY = "majorReviewV1";
const BOOKSHELF_KEY = "majorReviewBookshelfV1";

// ==================== 全局变量 ====================
let blocks = [];
let currentIndex = 0;
let currentFilter = "all";
let isContentHidden = false;

// 车轮复习相关
let reviewMode = false;
let reviewQueue = [];
let completedChapterNotified = [];
let books = [];
let currentBookId = null;
let bookSearchKeyword = "";
let studyGranularity = "leaf";
let isImmersiveMode = false;
let parseMode = "strict";
let pendingBlocks = [];

// DOM 元素引用
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
const bookTitleInput = document.getElementById("bookTitleInput");
const saveCurrentBookBtn = document.getElementById("saveCurrentBookBtn");
const newBlankBookBtn = document.getElementById("newBlankBookBtn");
const bookList = document.getElementById("bookList");
const bookSearchInput = document.getElementById("bookSearchInput");
const exportCurrentBookBtn = document.getElementById("exportCurrentBookBtn");
const exportShelfBtn = document.getElementById("exportShelfBtn");
const importShelfBtn = document.getElementById("importShelfBtn");
const importShelfFileInput = document.getElementById("importShelfFileInput");
const promptChoiceBtn = document.getElementById("promptChoiceBtn");
const promptBlankBtn = document.getElementById("promptBlankBtn");
const promptShortBtn = document.getElementById("promptShortBtn");
const promptMixedBtn = document.getElementById("promptMixedBtn");
const promptOutput = document.getElementById("promptOutput");
const copyPromptBtn = document.getElementById("copyPromptBtn");

const scoreInput = document.getElementById("scoreInput");
const applyScoreBtn = document.getElementById("applyScoreBtn");
const scoreHint = document.getElementById("scoreHint");
const studyGranularitySelect = document.getElementById("studyGranularitySelect");
const immersiveModeBtn = document.getElementById("immersiveModeBtn");
const importWordBtn = document.getElementById("importWordBtn");
const wordFileInput = document.getElementById("wordFileInput");

const generateCleanPromptBtn = document.getElementById("generateCleanPromptBtn");
const copyCleanPromptBtn = document.getElementById("copyCleanPromptBtn");
const cleanPromptOutput = document.getElementById("cleanPromptOutput");

const mobileNavButtons = document.querySelectorAll(".mobile-nav-btn");
const mobilePanels = document.querySelectorAll(".panel[data-panel]");
const parseModeSelect = document.getElementById("parseModeSelect");
const parsePreviewBox = document.getElementById("parsePreviewBox");
const parsePreviewList = document.getElementById("parsePreviewList");
const confirmParseBtn = document.getElementById("confirmParseBtn");
const cancelParseBtn = document.getElementById("cancelParseBtn");

// ==================== 事件监听 ====================
parseBtn.addEventListener("click", () => {
  const text = sourceText.value.trim();
  if (!text) {
    alert("请先粘贴复习资料。");
    return;
  }

  parseMode = parseModeSelect ? parseModeSelect.value : "strict";
  pendingBlocks = parseStudyText(text, parseMode).map(block => {
    return {
      ...block,
      previewState: guessInitialPreviewState(block)
    };
  });

  if (pendingBlocks.length === 0) {
    alert("没有识别到有效板块。请尝试切换拆解模式。");
    return;
  }

  renderParsePreview();
});
if (parseModeSelect) {
  parseModeSelect.addEventListener("change", () => {
    parseMode = parseModeSelect.value;
  });
}

confirmParseBtn.addEventListener("click", () => {
  confirmParsedBlocks();
});

cancelParseBtn.addEventListener("click", () => {
  pendingBlocks = [];
  parsePreviewBox.classList.add("hidden");
  parsePreviewList.innerHTML = "";
});

clearBtn.addEventListener("click", () => {
  if (!confirm("确定清空当前工作区吗？书架里已保存的复习本不会被删除。")) return;

  blocks = [];
  currentIndex = 0;
  currentFilter = "all";
  isContentHidden = false;
  reviewMode = false;
  reviewQueue = [];
  completedChapterNotified = [];
  currentBookId = null;
  sourceText.value = "";
  bookTitleInput.value = "";
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

saveCurrentBookBtn.addEventListener("click", () => {
  if (blocks.length === 0 && !sourceText.value.trim()) {
    alert("当前没有可保存的复习内容。");
    return;
  }

  const title = bookTitleInput.value.trim() || getBookTitleFromInputOrText(sourceText.value);
  saveCurrentBookToShelf(title);
  alert("当前复习本已保存到书架。");
});

newBlankBookBtn.addEventListener("click", () => {
  if (!confirm("确定新建空白复习本吗？当前未保存的修改可能会丢失。")) return;

  blocks = [];
  currentIndex = 0;
  currentFilter = "all";
  isContentHidden = false;
  reviewMode = false;
  reviewQueue = [];
  completedChapterNotified = [];
  currentBookId = null;
  sourceText.value = "";
  bookTitleInput.value = "";
  renderAll();
});
bookSearchInput.addEventListener("input", () => {
  bookSearchKeyword = bookSearchInput.value.trim();
  renderBookshelf();
});

exportCurrentBookBtn.addEventListener("click", () => {
  exportCurrentBook();
});

exportShelfBtn.addEventListener("click", () => {
  exportBookshelf();
});

importShelfBtn.addEventListener("click", () => {
  importShelfFileInput.click();
});

importShelfFileInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  importBookOrShelf(file);

  // 允许下次选择同一个文件
  importShelfFileInput.value = "";
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
studyGranularitySelect.addEventListener("change", () => {
  studyGranularity = studyGranularitySelect.value;

  const visible = getVisibleBlocks();
  if (visible.length > 0) {
    currentIndex = visible[0].realIndex;
  }

  isContentHidden = false;
  saveData();
  renderAll();
});

immersiveModeBtn.addEventListener("click", () => {
  isImmersiveMode = !isImmersiveMode;
  renderImmersiveMode();
});
importWordBtn.addEventListener("click", () => {
  wordFileInput.click();
});

wordFileInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  importWordFile(file);

  // 允许下次选择同一个文件
  wordFileInput.value = "";
});

generateCleanPromptBtn.addEventListener("click", () => {
  generateCleanPrompt();
});

copyCleanPromptBtn.addEventListener("click", async () => {
  const text = cleanPromptOutput.value.trim();

  if (!text) {
    alert("还没有可复制的整理 Prompt。");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("整理 Prompt 已复制。");
  } catch (error) {
    cleanPromptOutput.select();
    document.execCommand("copy");
    alert("整理 Prompt 已复制。");
  }
});

mobileNavButtons.forEach(button => {
  button.addEventListener("click", () => {
    setActiveMobilePanel(button.dataset.target);
  });
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

// ==================== 核心功能函数 ====================

/** 设置当前筛选条件 */
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

/** 生成复习队列（车轮复习） */
function generateReviewQueue() {
  if (blocks.length === 0) {
    alert("请先解析复习资料。");
    return;
  }

  const unknown = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.reviewType !== "reference" && item.block.status === "unknown");

  const fuzzy = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.reviewType !== "reference" && item.block.status === "fuzzy");
  const mastered = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.reviewType !== "reference" && item.block.status === "mastered");

  const none = blocks
    .map((block, index) => ({ block, realIndex: index }))
    .filter(item => item.block.reviewType !== "reference" && item.block.status === "none");

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

/** 从数组中随机抽取 count 个元素 */
function pickRandom(items, count) {
  if (count <= 0) return [];
  return shuffle([...items]).slice(0, Math.min(count, items.length));
}

/** 数组随机排序 */
function shuffle(items) {
  return items.sort(() => Math.random() - 0.5);
}

/** 获取当前可见的板块列表（根据筛选、复习模式或复习粒度） */
function getVisibleBlocks() {
  if (reviewMode) {
    return reviewQueue
      .filter(index => blocks[index])
      .map(index => ({
        block: blocks[index],
        realIndex: index,
        groupIndices: [index],
        isGroup: false
      }));
  }

  const rawItems = blocks
    .map((block, index) => ({
      block,
      realIndex: index,
      groupIndices: [index],
      isGroup: false
    }))
    .filter(item => {
      if (currentFilter === "all") return true;
      if (currentFilter === "none") return item.block.status === "none";
      return item.block.status === currentFilter;
    });

  if (studyGranularity === "leaf") {
    return rawItems;
  }

  const levelMap = {
    level1: 1,
    level2: 2,
    level3: 3
  };

  const targetLevel = levelMap[studyGranularity] || 1;

  return groupItemsByLevel(rawItems, targetLevel);
}
/** 按指定标题层级聚合学习卡片 */
function groupItemsByLevel(items, targetLevel) {
  const groupMap = new Map();

  items.forEach(item => {
    const block = item.block;
    const path = block.path && block.path.length > 0 ? block.path : ["未归类内容"];
    const keyPath = path.slice(0, Math.min(targetLevel, path.length));
    const key = keyPath.join(" > ");

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        path: keyPath,
        groupIndices: [],
        sourceItems: []
      });
    }

    const group = groupMap.get(key);
    group.groupIndices.push(item.realIndex);
    group.sourceItems.push(item);
  });

  return Array.from(groupMap.values()).map(group => {
    const groupBlocks = group.groupIndices.map(index => blocks[index]).filter(Boolean);
    const syntheticBlock = createGroupedBlock(group.path, groupBlocks);

    return {
      block: syntheticBlock,
      realIndex: group.groupIndices[0],
      groupIndices: group.groupIndices,
      isGroup: true
    };
  });
}

/** 创建聚合后的虚拟学习卡片 */
function createGroupedBlock(path, groupBlocks) {
  const title = path[path.length - 1] || "未归类内容";

  const content = groupBlocks.map(block => {
    return `【${block.path.join(" > ")}】
状态：${getStatusText(block.status)}
${block.content.trim() || "这个标题下暂时没有正文内容。"}`;
  }).join("\n\n");

  return {
    id: `group_${path.join("_")}`,
    title,
    level: path.length,
    path,
    content,
    status: getGroupedStatus(groupBlocks)
  };
}

/** 聚合卡片状态：不会优先，其次模糊，其次未标记，全部掌握才掌握 */
function getGroupedStatus(groupBlocks) {
  if (groupBlocks.some(block => block.status === "unknown")) return "unknown";
  if (groupBlocks.some(block => block.status === "fuzzy")) return "fuzzy";
  if (groupBlocks.some(block => block.status === "none")) return "none";
  if (groupBlocks.length > 0 && groupBlocks.every(block => block.status === "mastered")) return "mastered";
  return "none";
}

/** 获取当前正在显示的学习项 */
function getCurrentStudyItem() {
  const visible = getVisibleBlocks();

  if (visible.length === 0) return null;

  let item = visible.find(item => item.realIndex === currentIndex);

  if (!item) {
    item = visible[0];
    currentIndex = item.realIndex;
  }

  return item;
}

/** 标记当前板块或当前聚合卡片的状态 */
function markCurrent(status) {
  const currentItem = getCurrentStudyItem();
  if (!currentItem) return;

  const indices = currentItem.groupIndices || [currentIndex];

  const studyIndices = indices.filter(index => {
    return blocks[index] && blocks[index].reviewType !== "reference" && blocks[index].status !== "reference";
  });

  if (studyIndices.length === 0) {
    alert("当前内容是参考信息，不参与掌握状态标记。");
    return;
  }

  studyIndices.forEach(index => {
    blocks[index].status = status;
  });

  const completedChapterTitle = checkCurrentChapterCompleted();

  saveData();
  renderAll();

  if (completedChapterTitle) {
    showChapterCompletePrompt(completedChapterTitle);
  }
}

/** 解析粘贴的复习资料，提取板块结构 */
function parseStudyText(text, mode = "strict") {
  if (mode === "blank") {
    return parseByBlankParagraphs(text);
  }

  if (mode === "qa") {
    return parseByQuestionAnswer(text);
  }

  return parseByHeadings(text, mode);
}

/** 按标题解析：strict / loose */
function parseByHeadings(text, mode = "strict") {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const result = [];
  const path = [];
  let currentBlock = null;

  for (const line of lines) {
    const heading = detectHeading(line, mode);

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
        status: "none",
        reviewType: "study"
      };
    } else {
      if (!currentBlock) {
        currentBlock = {
          id: createId(),
          title: "未归类内容",
          level: 1,
          path: ["未归类内容"],
          content: "",
          status: "none",
          reviewType: "study"
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

/** 按空行拆分：适合一段一个知识点 */
function parseByBlankParagraphs(text) {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return paragraphs.map((paragraph, index) => {
    const firstLine = paragraph.split("\n").map(line => line.trim()).find(Boolean) || `知识点 ${index + 1}`;
    const title = firstLine.length > 28 ? firstLine.slice(0, 28) + "…" : firstLine;

    return {
      id: createId(),
      title,
      level: 1,
      path: [title],
      content: paragraph,
      status: "none",
      reviewType: "study"
    };
  });
}

/** 简答题/题目式拆分：适合“题目 + 答案”资料 */
function parseByQuestionAnswer(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const result = [];
  let currentBlock = null;

  for (const line of lines) {
    const isQuestionTitle = isLikelyQuestionTitle(line, currentBlock);

    if (isQuestionTitle) {
      if (currentBlock && currentBlock.content.trim()) {
        result.push(currentBlock);
      }

      currentBlock = {
        id: createId(),
        title: cleanHeading(line),
        level: 1,
        path: [cleanHeading(line)],
        content: "",
        status: "none",
        reviewType: "study"
      };
    } else {
      if (!currentBlock) {
        const title = line.length > 28 ? line.slice(0, 28) + "…" : line;
        currentBlock = {
          id: createId(),
          title,
          level: 1,
          path: [title],
          content: "",
          status: "none",
          reviewType: "study"
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

/** 检测一行是否为标题，返回标题级别和清理后的标题 */
function detectHeading(line, mode = "strict") {
  // 宽松模式下，像“1. 使心理学成为……”这种编号答案条目，不当作标题
  if (mode === "loose" && isLikelyAnswerListItem(line)) {
    return null;
  }

  const patterns = [
    { level: 1, regex: /^(第[一二三四五六七八九十百千万\d]+[章节篇部分编].*)$/ },
    { level: 2, regex: /^([一二三四五六七八九十]+、.+)$/ },
    { level: 3, regex: /^(（[一二三四五六七八九十]+）.+)$/ },
    { level: 4, regex: /^(\d+[、.．]\s*.+)$/ },
    { level: 5, regex: /^(（\d+）.+)$/ },
    { level: 5, regex: /^([①②③④⑤⑥⑦⑧⑨⑩].+)$/ },
    { level: 1, regex: /^(#{1}\s+.+)$/ },
    { level: 2, regex: /^(#{2}\s+.+)$/ },
    { level: 3, regex: /^(#{3}\s+.+)$/ },
    { level: 4, regex: /^(#{4}\s+.+)$/ }
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

  if (mode === "loose" && isLikelyLooseHeading(line)) {
    return {
      level: guessLooseHeadingLevel(line),
      title: cleanHeading(line)
    };
  }

  return null;
}

/** 清理标题中的 Markdown 标记 */
function cleanHeading(title) {
  return title.replace(/^#{1,3}\s*/, "").trim();
}
/** 宽松模式：判断是否像标题 */
function isLikelyLooseHeading(line) {
  const text = line.trim();

  if (!text) return false;
  if (text.length > 32) return false;
  if (/^(答|答案|解析|说明|注意)[:：]/.test(text)) return false;
  if (/[。；;]$/.test(text)) return false;
  if (/^\d+(\.\d+)+/.test(text)) return true;

  const headingKeywords = [
    "概念", "定义", "特点", "特征", "类型", "分类", "原则", "方法", "意义", "作用",
    "影响", "原因", "过程", "阶段", "理论", "观点", "代表人物", "评价", "贡献", "局限",
    "实验", "研究", "比较", "区别", "联系", "应用"
  ];

  if (headingKeywords.some(keyword => text.includes(keyword))) return true;

  // 很短的独立名词短语，常见于老师整理的复习资料
  if (text.length <= 12 && !/[，,：:]/.test(text)) return true;

  return false;
}
/** 判断是否像答案中的编号条目，而不是标题 */
function isLikelyAnswerListItem(line) {
  const text = line.trim();

  if (!text) return false;

  // 1. xxx。 / 1、xxx。 / 1．xxx。
  if (/^\d+[、.．]\s*.+[。；;！!]$/.test(text)) {
    return true;
  }

  // （1）xxx。
  if (/^（\d+）\s*.+[。；;！!]$/.test(text)) {
    return true;
  }

  // ①xxx。
  if (/^[①②③④⑤⑥⑦⑧⑨⑩]\s*.+[。；;！!]$/.test(text)) {
    return true;
  }

  return false;
}

/** 宽松模式：粗略判断标题层级 */
function guessLooseHeadingLevel(line) {
  const text = line.trim();

  if (/^(第[一二三四五六七八九十百千万\d]+[章节篇部分编])/.test(text)) return 1;
  if (/^[一二三四五六七八九十]+、/.test(text)) return 2;
  if (/^（[一二三四五六七八九十]+）/.test(text)) return 3;
  if (/^\d+[、.．]/.test(text)) return 4;

  if (text.includes("章") || text.includes("绪论")) return 1;
  if (text.length <= 10) return 2;

  return 3;
}

/** 题目式拆分：判断一行是否像简答题题目 */
function isLikelyQuestionTitle(line, currentBlock = null) {
  const text = line.trim();

  if (!text) return false;
  if (text.length > 45) return false;

  // 明显是答案正文，不作为题目
  if (/^(答|答案|解析|说明|注意)[:：]/.test(text)) return false;
  if (/^(贡献|局限|优点|缺点|特点|特征|内容|意义|作用|原因|影响|过程|阶段)[:：]/.test(text)) return false;

  // 只要已经处在某个题目下面，编号行默认当作答案条目，而不是新题目
  if (currentBlock && /^[（(]?\d+[）)]?[、.．]\s*/.test(text)) {
    return false;
  }

  // 当前已有题目时，（1）（2）①②③ 也默认当作答案条目
  if (currentBlock && /^（\d+）/.test(text)) return false;
  if (currentBlock && /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return false;

  // 明确题目动词开头
  if (/^(简述|论述|说明|比较|分析|评价|解释|试述)/.test(text)) return true;

  // 如果当前还没有题目，允许编号题目作为开头
  if (!currentBlock && /^[（(]?\d+[）)]?[、.．]\s*/.test(text)) {
    return true;
  }

  const titleKeywords = [
    "贡献", "评价", "局限", "意义", "特点", "特征", "理论", "观点", "方法",
    "影响因素", "基本问题", "主要观点", "主要内容", "区别", "联系",
    "意识流", "自我理论", "人格发展理论", "研究方法"
  ];

  if (titleKeywords.some(keyword => text.includes(keyword))) {
    // 如果是一整句解释性正文，不当标题
    if (/[。；;！!]$/.test(text) && text.length > 18) return false;
    return true;
  }

  // 类似“意识流”“冯特的贡献”“行为主义评价”
  if (text.length <= 18 && !/[。；;，,：:]/.test(text)) return true;

  return false;
}

/** 判断是否明显是考试信息、目录、评分标准等非背诵卡片 */
function guessInitialPreviewState(block) {
  const text = `${block.title}\n${block.content}`.trim();

  const referenceKeywords = [
    "目录", "题型", "评分标准", "考试时间", "总计", "共 100 分", "共100分",
    "选择", "填空", "名词", "简答", "论述", "案例", "分/个", "页码"
  ];

  if (referenceKeywords.some(keyword => text.includes(keyword))) {
    return "reference";
  }

  if (/^\d+$/.test(block.title.trim())) {
    return "exclude";
  }

  return "keep";
}

/** 生成唯一 ID */
function createId() {
  return "block_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

// ==================== 渲染函数 ====================

/** 全局渲染入口 */
function renderAll() {
  renderStats();
  renderFilterButtons();
  renderReviewSummary();
  renderTree();
  renderCard();
  renderProgressPanel();
  renderBookshelf();
}
/** 渲染拆解预览 */
function renderParsePreview() {
  parsePreviewBox.classList.remove("hidden");
  parsePreviewList.innerHTML = "";

  const keepCount = pendingBlocks.filter(b => b.previewState === "keep").length;
  const refCount = pendingBlocks.filter(b => b.previewState === "reference").length;
  const excludeCount = pendingBlocks.filter(b => b.previewState === "exclude").length;

  const summary = document.createElement("div");
  summary.className = "preview-item";
  summary.innerHTML = `
    <div class="preview-title">预览统计</div>
    <div class="preview-path">
      保留复习：${keepCount} 个；
      参考信息：${refCount} 个；
      排除不用：${excludeCount} 个。
    </div>
  `;
  parsePreviewList.appendChild(summary);

  pendingBlocks.forEach((block, index) => {
    const item = document.createElement("div");
    item.className = `preview-item ${block.previewState}`;

    const stateText = getPreviewStateText(block.previewState);
    const contentPreview = block.content.trim().slice(0, 260);

    item.innerHTML = `
      <div class="preview-title">
        ${index + 1}. ${escapeHtml(block.title)}
        <span class="preview-state">${stateText}</span>
      </div>
      <div class="preview-path">${escapeHtml(block.path.join(" > "))}</div>
      <div class="preview-content">${escapeHtml(contentPreview || "这个板块暂时没有正文内容。")}</div>
      <div class="preview-actions">
        <button data-index="${index}" data-action="keep">保留复习</button>
        <button class="secondary" data-index="${index}" data-action="reference">设为参考</button>
        <button class="book-delete-btn" data-index="${index}" data-action="exclude">排除不用</button>
      </div>
    `;

    const buttons = item.querySelectorAll("button[data-action]");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const blockIndex = Number(button.dataset.index);
        const action = button.dataset.action;

        if (pendingBlocks[blockIndex]) {
          pendingBlocks[blockIndex].previewState = action;
          renderParsePreview();
        }
      });
    });

    parsePreviewList.appendChild(item);
  });
}

/** 获取预览状态文本 */
function getPreviewStateText(state) {
  if (state === "keep") return "保留复习";
  if (state === "reference") return "参考信息";
  if (state === "exclude") return "排除不用";
  return "未设置";
}

/** 确认预览并生成复习本 */
function confirmParsedBlocks() {
  const kept = pendingBlocks.filter(block => block.previewState !== "exclude");

  if (kept.length === 0) {
    alert("没有可生成的板块。请至少保留一个复习板块或参考信息。");
    return;
  }

  const studyBlocks = kept.filter(block => block.previewState === "keep");

  if (studyBlocks.length === 0) {
    if (!confirm("当前没有任何“保留复习”的知识点，只有参考信息。确定继续生成复习本吗？")) {
      return;
    }
  }

  blocks = kept.map(block => {
    const isReference = block.previewState === "reference";

    return {
      id: block.id || createId(),
      title: block.title,
      level: block.level || 1,
      path: block.path && block.path.length > 0 ? block.path : [block.title],
      content: block.content || "",
      status: isReference ? "reference" : "none",
      reviewType: isReference ? "reference" : "study"
    };
  });

  currentIndex = 0;
  currentFilter = "all";
  studyGranularity = "leaf";
  isContentHidden = false;
  reviewMode = false;
  reviewQueue = [];
  completedChapterNotified = [];

  if (studyGranularitySelect) {
    studyGranularitySelect.value = "leaf";
  }

  currentBookId = createId();
  const title = getBookTitleFromInputOrText(sourceText.value);

  bookTitleInput.value = title;
  saveCurrentBookToShelf(title);

  pendingBlocks = [];
  parsePreviewBox.classList.add("hidden");
  parsePreviewList.innerHTML = "";

  renderAll();
}

/** 渲染顶部统计 */
function renderStats() {
  const stats = calculateStats(blocks);

  totalCount.textContent = stats.total;
  masteredCount.textContent = stats.mastered;
  fuzzyCount.textContent = stats.fuzzy;
  unknownCount.textContent = stats.unknown;
}

/** 渲染整体进度面板 */
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

/** 渲染薄弱板块列表 */
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

/** 渲染章节统计 */
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

/** 按一级标题分组 */
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

/** 计算统计信息 */
function calculateStats(list) {
  const studyList = list.filter(b => b.reviewType !== "reference" && b.status !== "reference");

  return {
    total: studyList.length,
    mastered: studyList.filter(b => b.status === "mastered").length,
    fuzzy: studyList.filter(b => b.status === "fuzzy").length,
    unknown: studyList.filter(b => b.status === "unknown").length,
    none: studyList.filter(b => b.status === "none").length
  };
}
/** 根据掌握率和未掌握数返回进度条样式类 */
function getProgressClass(masteredRate, unknownCount) {
  if (unknownCount > 0 || masteredRate < 40) return "danger";
  if (masteredRate < 75) return "warning";
  return "safe";
}

/** 获取板块的薄弱分数（unknown=2, fuzzy=1） */
function getWeakScore(block) {
  if (block.status === "unknown") return 2;
  if (block.status === "fuzzy") return 1;
  return 0;
}

/** 获取最薄弱板块的索引（优先 unknown，其次 fuzzy） */
function getWeakestBlockIndex() {
  const unknownIndex = blocks.findIndex(block => block.status === "unknown");
  if (unknownIndex !== -1) return unknownIndex;

  const fuzzyIndex = blocks.findIndex(block => block.status === "fuzzy");
  if (fuzzyIndex !== -1) return fuzzyIndex;

  return null;
}

/** 检查当前章节是否全部标记完成（无 none 状态） */
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

/** 显示章节完成提示框 */
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

/** 显示当前章节完整回顾内容 */
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

/** 渲染筛选按钮的高亮状态 */
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

/** 渲染复习模式摘要信息 */
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

/** 渲染左侧目录树 */
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

/** 渲染右侧卡片内容 */
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

  const currentItem = getCurrentStudyItem();
  if (!currentItem) return;

  emptyState.classList.add("hidden");
  cardArea.classList.remove("hidden");

  if (!chapterReview.dataset.keepOpen) {
    chapterReview.classList.add("hidden");
  }

  const block = currentItem.block;
  const visiblePosition = visible.findIndex(item => item.realIndex === currentItem.realIndex);

  const prefix = reviewMode ? "复习队列 " : "";
  const groupText = currentItem.isGroup ? ` · 聚合 ${currentItem.groupIndices.length} 个知识点` : "";

  cardIndex.textContent = `${prefix}${visiblePosition + 1} / ${visible.length}${groupText}`;
  cardTitle.textContent = block.title;
  cardPath.textContent = block.path.join(" > ");
  cardContent.textContent = block.content.trim() || "这个标题下暂时没有正文内容。";

  cardContent.classList.toggle("masked", isContentHidden);
  toggleAnswerBtn.textContent = isContentHidden ? "显示内容" : "隐藏内容，先背诵";

  cardStatus.className = `status ${block.status}`;
  cardStatus.textContent = getStatusText(block.status);
}

/** 获取状态文本 */
function getStatusText(status) {
  if (status === "mastered") return "掌握";
  if (status === "fuzzy") return "模糊";
  if (status === "unknown") return "不会";
  if (status === "reference") return "参考";
  return "未标记";
}
/** 获取状态图标 */
function getStatusIcon(status) {
  if (status === "mastered") return "✅";
  if (status === "fuzzy") return "🟡";
  if (status === "unknown") return "🔴";
  if (status === "reference") return "📎";
  return "⚪";
}

// ==================== 数据持久化 ====================

/** 保存当前数据到 localStorage */
function saveData() {
  const data = getCurrentBookData();

  // 保留一个“最近打开”的工作区，兼容旧逻辑
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // 如果当前已经属于某本复习本，则同步更新书架中的这本书
  if (currentBookId) {
    const index = books.findIndex(book => book.id === currentBookId);

    if (index !== -1) {
      books[index].title = bookTitleInput.value.trim() || books[index].title;
      books[index].updatedAt = new Date().toISOString();
      books[index].data = data;
      saveBookshelf();
      renderBookshelf();
    }
  }
}

/** 加载数据（兼容书架和旧版单本） */
function loadData() {
  loadBookshelf();

  const shelfRaw = localStorage.getItem(BOOKSHELF_KEY);

  if (shelfRaw) {
    try {
      const shelf = JSON.parse(shelfRaw);
      currentBookId = shelf.currentBookId || null;

      const currentBook = books.find(book => book.id === currentBookId);

      if (currentBook) {
        applyBookData(currentBook.data);
        bookTitleInput.value = currentBook.title || "";
        return;
      }
    } catch (error) {
      console.error("读取书架失败：", error);
    }
  }

  // 兼容旧版本：如果没有书架，就读取原来的单本记录
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    applyBookData(data);
  } catch (error) {
    console.error("读取本地记录失败：", error);
  }
}

function getCurrentBookData() {
  return {
    sourceText: sourceText.value,
    blocks,
    currentIndex,
    currentFilter,
    studyGranularity,
    reviewMode,
    reviewQueue,
    completedChapterNotified
  };
}

/** 应用复习本数据到全局变量 */
function applyBookData(data) {
  sourceText.value = data.sourceText || "";
  blocks = data.blocks || [];
  currentIndex = data.currentIndex || 0;
  currentFilter = data.currentFilter || "all";
  studyGranularity = data.studyGranularity || "leaf";
  reviewMode = data.reviewMode || false;
  reviewQueue = data.reviewQueue || [];
  completedChapterNotified = data.completedChapterNotified || [];
  isContentHidden = false;

  if (studyGranularitySelect) {
    studyGranularitySelect.value = studyGranularity;
  }
}

/** 加载书架数据 */
function loadBookshelf() {
  const raw = localStorage.getItem(BOOKSHELF_KEY);

  if (!raw) {
    books = [];
    currentBookId = null;
    return;
  }

  try {
    const shelf = JSON.parse(raw);
    books = shelf.books || [];
    currentBookId = shelf.currentBookId || null;
  } catch (error) {
    console.error("读取书架失败：", error);
    books = [];
    currentBookId = null;
  }
}

/** 保存书架到 localStorage */
function saveBookshelf() {
  const shelf = {
    books,
    currentBookId
  };

  localStorage.setItem(BOOKSHELF_KEY, JSON.stringify(shelf));
}

/** 将当前复习本保存到书架 */
function saveCurrentBookToShelf(title) {
  const now = new Date().toISOString();
  const data = getCurrentBookData();

  if (!currentBookId) {
    currentBookId = createId();
  }

  const existingIndex = books.findIndex(book => book.id === currentBookId);

  const book = {
    id: currentBookId,
    title: title || "未命名复习本",
    createdAt: existingIndex !== -1 ? books[existingIndex].createdAt : now,
    updatedAt: now,
    data
  };

  if (existingIndex !== -1) {
    books[existingIndex] = book;
  } else {
    books.unshift(book);
  }

  bookTitleInput.value = book.title;
  saveBookshelf();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderBookshelf();
}

/** 打开指定复习本 */
function openBook(bookId) {
  const book = books.find(item => item.id === bookId);

  if (!book) {
    alert("没有找到这本复习本。");
    return;
  }

  currentBookId = book.id;
  applyBookData(book.data);
  bookTitleInput.value = book.title || "";

  saveBookshelf();
  saveData();
  renderAll();
}

/** 删除指定复习本 */
function deleteBook(bookId) {
  const book = books.find(item => item.id === bookId);
  if (!book) return;

  if (!confirm(`确定删除复习本《${book.title}》吗？这个操作不能恢复。`)) return;

  books = books.filter(item => item.id !== bookId);

  if (currentBookId === bookId) {
    currentBookId = books.length > 0 ? books[0].id : null;

    if (currentBookId) {
      const nextBook = books.find(item => item.id === currentBookId);
      applyBookData(nextBook.data);
      bookTitleInput.value = nextBook.title || "";
    } else {
      blocks = [];
      currentIndex = 0;
      currentFilter = "all";
      isContentHidden = false;
      reviewMode = false;
      reviewQueue = [];
      completedChapterNotified = [];
      sourceText.value = "";
      bookTitleInput.value = "";
    }
  }

  saveBookshelf();
  renderAll();
}

/** 渲染书架列表 */
function renderBookshelf() {
  if (!bookList) return;

  if (books.length === 0) {
    bookList.className = "book-list empty";
    bookList.textContent = "暂无复习本。";
    return;
  }

  const keyword = bookSearchKeyword.trim().toLowerCase();

  let visibleBooks = [...books];

  if (keyword) {
    visibleBooks = visibleBooks.filter(book => {
      const title = (book.title || "").toLowerCase();
      return title.includes(keyword);
    });
  }

  visibleBooks.sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });

  if (visibleBooks.length === 0) {
    bookList.className = "book-list empty";
    bookList.textContent = "没有匹配的复习本。";
    return;
  }

  bookList.className = "book-list";
  bookList.innerHTML = "";

  visibleBooks.forEach(book => {
    const stats = calculateStats(book.data.blocks || []);
    const updatedText = formatDateTime(book.updatedAt);
    const masteredRate = stats.total > 0
      ? Math.round(stats.mastered / stats.total * 100)
      : 0;

    const item = document.createElement("div");
    item.className = "book-item";
    if (book.id === currentBookId) item.classList.add("active");

    item.innerHTML = `
      <div class="book-item-title">📘 ${escapeHtml(book.title)}</div>
      <div class="book-item-meta">
        总板块：${stats.total}；
        掌握：${stats.mastered}；
        模糊：${stats.fuzzy}；
        不会：${stats.unknown}；
        掌握率：${masteredRate}%<br>
        最近更新：${updatedText}
      </div>

      <div class="book-rate">
        <div class="book-rate-bar">
          <div class="book-rate-inner" style="width: ${masteredRate}%"></div>
        </div>
      </div>

      <div class="book-item-actions">
        <button class="book-rename-btn" data-book-id="${book.id}">重命名</button>
        <button class="book-export-btn" data-book-id="${book.id}">导出</button>
        <button class="book-delete-btn" data-book-id="${book.id}">删除</button>
      </div>
    `;

    item.addEventListener("click", event => {
      if (
        event.target.classList.contains("book-delete-btn") ||
        event.target.classList.contains("book-rename-btn") ||
        event.target.classList.contains("book-export-btn")
      ) {
        return;
      }

      openBook(book.id);
    });

    const renameBtn = item.querySelector(".book-rename-btn");
    renameBtn.addEventListener("click", event => {
      event.stopPropagation();
      renameBook(book.id);
    });

    const exportBtn = item.querySelector(".book-export-btn");
    exportBtn.addEventListener("click", event => {
      event.stopPropagation();
      exportSingleBook(book.id);
    });

    const deleteBtn = item.querySelector(".book-delete-btn");
    deleteBtn.addEventListener("click", event => {
      event.stopPropagation();
      deleteBook(book.id);
    });

    bookList.appendChild(item);
  });
}

// ==================== 辅助函数 ====================

/** 从输入框或文本内容中提取书名 */
function getBookTitleFromInputOrText(text) {
  const inputTitle = bookTitleInput.value.trim();
  if (inputTitle) return inputTitle;

  const firstLine = text
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.trim())
    .find(line => line.length > 0);

  return firstLine ? firstLine.slice(0, 30) : "未命名复习本";
}

/** 格式化日期时间 */
function formatDateTime(isoString) {
  if (!isoString) return "未知";

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return "未知";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
/** 重命名复习本 */
function renameBook(bookId) {
  const book = books.find(item => item.id === bookId);

  if (!book) {
    alert("没有找到这本复习本。");
    return;
  }

  const newTitle = prompt("请输入新的复习本名称：", book.title);

  if (newTitle === null) return;

  const trimmedTitle = newTitle.trim();

  if (!trimmedTitle) {
    alert("复习本名称不能为空。");
    return;
  }

  book.title = trimmedTitle;
  book.updatedAt = new Date().toISOString();

  if (book.id === currentBookId) {
    bookTitleInput.value = trimmedTitle;
  }

  saveBookshelf();
  renderBookshelf();
}

/** 导出当前打开的复习本 */
function exportCurrentBook() {
  if (!currentBookId) {
    alert("当前没有打开任何复习本。");
    return;
  }

  exportSingleBook(currentBookId);
}

/** 导出指定复习本 */
function exportSingleBook(bookId) {
  const book = books.find(item => item.id === bookId);

  if (!book) {
    alert("没有找到这本复习本。");
    return;
  }

  const payload = {
    appName: "MajorReview",
    exportType: "singleBook",
    version: "1.8",
    exportedAt: new Date().toISOString(),
    book
  };

  const fileName = `MajorReview-复习本-${getSafeFileName(book.title)}-${getTodayText()}.json`;
  downloadJson(payload, fileName);
}

/** 导出整个书架 */
function exportBookshelf() {
  if (books.length === 0) {
    alert("书架为空，没有可导出的内容。");
    return;
  }

  const payload = {
    appName: "MajorReview",
    exportType: "bookshelf",
    version: "1.8",
    exportedAt: new Date().toISOString(),
    books,
    currentBookId
  };

  const fileName = `MajorReview-完整书架-${getTodayText()}.json`;
  downloadJson(payload, fileName);
}

/** 导入单本复习本或完整书架 */
function importBookOrShelf(file) {
  const reader = new FileReader();

  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);

      if (!data || data.appName !== "MajorReview") {
        alert("这不是有效的 MajorReview 备份文件。");
        return;
      }

      if (data.exportType === "singleBook" && data.book) {
        importSingleBook(data.book);
        return;
      }

      if (data.exportType === "bookshelf" && Array.isArray(data.books)) {
        importFullBookshelf(data);
        return;
      }

      alert("无法识别这个备份文件的类型。");
    } catch (error) {
      console.error(error);
      alert("导入失败：文件格式可能不正确。");
    }
  };

  reader.readAsText(file, "utf-8");
}

/** 导入单本复习本 */
function importSingleBook(importedBook) {
  const confirmed = confirm(`确定导入复习本《${importedBook.title || "未命名复习本"}》吗？`);

  if (!confirmed) return;

  const now = new Date().toISOString();

  const newBook = {
    id: createId(),
    title: importedBook.title || "导入的复习本",
    createdAt: importedBook.createdAt || now,
    updatedAt: now,
    data: importedBook.data || {
      sourceText: "",
      blocks: [],
      currentIndex: 0,
      currentFilter: "all",
      reviewMode: false,
      reviewQueue: [],
      completedChapterNotified: []
    }
  };

  books.unshift(newBook);
  currentBookId = newBook.id;

  applyBookData(newBook.data);
  bookTitleInput.value = newBook.title;

  saveBookshelf();
  saveData();
  renderAll();

  alert("复习本导入成功。");
}

/** 导入完整书架 */
function importFullBookshelf(data) {
  const confirmed = confirm(
    "检测到这是完整书架备份。\n\n点击“确定”：用备份覆盖当前书架。\n点击“取消”：取消导入，不做任何修改。"
  );

  if (!confirmed) return;

  books = data.books.map(book => {
    return {
      id: book.id || createId(),
      title: book.title || "未命名复习本",
      createdAt: book.createdAt || new Date().toISOString(),
      updatedAt: book.updatedAt || new Date().toISOString(),
      data: book.data || {
        sourceText: "",
        blocks: [],
        currentIndex: 0,
        currentFilter: "all",
        reviewMode: false,
        reviewQueue: [],
        completedChapterNotified: []
      }
    };
  });

  currentBookId = data.currentBookId || (books[0] ? books[0].id : null);

  const currentBook = books.find(book => book.id === currentBookId) || books[0];

  if (currentBook) {
    currentBookId = currentBook.id;
    applyBookData(currentBook.data);
    bookTitleInput.value = currentBook.title;
  } else {
    blocks = [];
    currentIndex = 0;
    currentFilter = "all";
    reviewMode = false;
    reviewQueue = [];
    completedChapterNotified = [];
    sourceText.value = "";
    bookTitleInput.value = "";
  }

  saveBookshelf();
  saveData();
  renderAll();

  alert("完整书架导入成功。");
}

/** 下载 JSON 文件 */
function downloadJson(data, fileName) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/** 生成安全文件名 */
function getSafeFileName(name) {
  return String(name || "未命名")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 40);
}

/** 获取今天日期 */
function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

/** 防止书名里的特殊字符破坏 HTML */
function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
/** 生成资料整理 Prompt */
function generateCleanPrompt() {
  const text = sourceText.value.trim();

  if (!text) {
    alert("请先粘贴或导入需要整理的复习资料。");
    return;
  }

  const modeText = parseModeSelect
    ? parseModeSelect.options[parseModeSelect.selectedIndex].text
    : "未指定";

  const prompt = `请帮我把下面这份专业课期末复习资料整理成结构清晰、适合导入复习工具的层级化文本。

【整理目标】
把原始资料整理为稳定的标题层级，方便后续拆解成复习卡片。

【推荐层级格式】
第一章 XXX
一、XXX
（一）XXX
1. XXX
（1）XXX

【整理要求】
1. 保留原文中的核心知识点，不要删减重要概念、理论、人物、实验、评价、贡献、局限、阶段、分类和比较。
2. 不要编造原文没有的知识点。
3. 可以修正明显的格式混乱、换行混乱、编号混乱。
4. 删除或单独归类明显不属于背诵知识点的内容，例如：
   - 目录点线
   - 页码
   - 重复页眉页脚
   - 无意义符号
5. 对题型、评分标准、考试时间、分值安排等内容，不要混入知识点正文，请单独放到：
【考试信息】
6. 如果遇到表格，请尽量改写成条目：
   - 概念：
   - 特点：
   - 区别：
   - 例子：
7. 如果原文是“简答题题目 + 答案”形式，请保留题目作为标题，答案作为正文。
8. 输出时只给整理后的正文，不要解释你做了什么。

【我当前准备用的拆解模式】
${modeText}

【原始资料】
${text}`;

  cleanPromptOutput.value = prompt;
}

/** 导入 Word 文档 */
function importWordFile(file) {
  const fileName = file.name || "";
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".doc") && !lowerName.endsWith(".docx")) {
    alert("当前浏览器版暂不稳定支持 .doc 老格式。请先用 Word/WPS 把它另存为 .docx，再导入。");
    return;
  }

  if (!lowerName.endsWith(".docx")) {
    alert("请导入 .docx 格式的 Word 文档。");
    return;
  }

  if (typeof mammoth === "undefined") {
    alert("Word 解析库还没有加载成功。请检查网络，或刷新页面后重试。");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    const arrayBuffer = event.target.result;

    mammoth.extractRawText({ arrayBuffer })
      .then(result => {
        const text = (result.value || "").trim();

        if (!text) {
          alert("没有从 Word 文档中读取到文字。这个文件可能主要是图片或扫描件。");
          return;
        }

        sourceText.value = text;

        const title = fileName.replace(/\.docx$/i, "");
        if (title && !bookTitleInput.value.trim()) {
          bookTitleInput.value = title;
        }

        alert("Word 文档导入成功。请检查文本内容，然后选择拆解模式并点击“解析资料”。");
      })
      .catch(error => {
        console.error(error);
        alert("Word 文档解析失败。请确认文件是正常的 .docx 文档。");
      });
  };

  reader.readAsArrayBuffer(file);
}

/** 设置手机端当前显示的功能分页 */
function setActiveMobilePanel(target) {
  if (!target) return;

  mobileNavButtons.forEach(button => {
    button.classList.toggle("active-mobile-tab", button.dataset.target === target);
  });

  mobilePanels.forEach(panel => {
    panel.classList.toggle("active-mobile-panel", panel.dataset.panel === target);
  });
}

/** 初始化手机分页 */
function initMobilePanels() {
  setActiveMobilePanel("input-panel");
}

/** 渲染沉浸式背诵模式 */
function renderImmersiveMode() {
  document.body.classList.toggle("immersive-mode", isImmersiveMode);
  immersiveModeBtn.textContent = isImmersiveMode ? "退出沉浸背诵" : "进入沉浸背诵";
}

/** 生成 Prompt（根据类型） */
function generatePrompt(type) {
  if (!blocks[currentIndex]) {
    alert("当前没有学习板块。");
    return;
  }

const currentItem = getCurrentStudyItem();
if (!currentItem) {
  alert("当前没有学习板块。");
  return;
}

const block = currentItem.block;
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

/** 根据正确率自动标记当前板块或聚合卡片状态 */
function applyScoreToCurrentBlock() {
  const currentItem = getCurrentStudyItem();

  if (!currentItem) {
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

  const indices = currentItem.groupIndices || [currentIndex];

  const studyIndices = indices.filter(index => {
    return blocks[index] && blocks[index].reviewType !== "reference" && blocks[index].status !== "reference";
  });

  if (studyIndices.length === 0) {
    alert("当前内容是参考信息，不参与正确率判定。");
    return;
  }

  studyIndices.forEach(index => {
    blocks[index].status = newStatus;
  });

  scoreHint.textContent = currentItem.isGroup
    ? `${message} 已同步应用到当前聚合卡片下的 ${studyIndices.length} 个复习知识点。`
    : message;

  saveData();
  renderAll();
}

// ==================== 初始化 ====================
loadData();
renderAll();
renderImmersiveMode();
initMobilePanels();
