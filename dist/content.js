/*
 * 網站內容資料｜日常更新優先修改本檔案
 *
 * 01 個人資料 profile       → 姓名、職稱、簡介與聯絡方式
 * 02 互動展示 showcase      → 代表作畫面、切換標籤與正式入口
 * 03 專業能力 competencies  → 首頁與履歷共用的能力介紹
 * 04 作品案例 projects      → 作品列表及案例詳情
 * 05 技術筆記 knowledge     → 知識庫分類、搜尋與主題詳情
 * 06 履歷摘要 resume        → 個人摘要、技術標籤與待補資料
 * 07 個人小工具 tools       → 工具箱的名稱、分類、說明、標籤與網址
 *
 * 新增作品或筆記時，複製同一陣列中的一個完整物件，再修改欄位。
 * id 必須保持唯一；已使用的 id 請盡量保留，避免既有主題網址失效。
 * 文字以單引號包住，字串中的單引號需寫成 \'，物件之間以逗號分隔。
 * 本站內容以已知資料為依據；未確認的作品細節與文章範本需保留狀態說明。
 */
window.SITE_CONTENT = {
  // ── 07｜個人小工具：新增工具時，將物件加入這個陣列。 ──
  // 範例欄位：{ id: 'my-tool', title: '工具名稱', category: '日常工具',
  // description: '這個工具能幫忙完成的事情', url: 'tools/my-tool/index.html',
  // icon: 'grid', tags: ['關鍵字'], source: '個人工具' }
  // url 可填完整 HTTP(S) 網址，或相對於 dist/index.html 的本機 HTML 路徑。
  // icon 可用 calculator、code、document、grid、badminton；本機工具可放在 dist/tools/。
  tools: [
    {
      id: 'badminton',
      title: '羽球開打',
      category: '休閒運動',
      description: '單雙打公平分組、輪替計分與發球站位，一頁整理球友、場地和對戰紀錄。',
      url: 'tools/badminton/index.html',
      icon: 'badminton',
      tags: ['羽球', '分組', '計分', '站位', '離線使用'],
      source: '個人工具'
    },
    {
      id: 'fanuc-macro',
      title: 'FANUC Macro B 指令手冊',
      category: 'CNC 加工',
      description: '搜尋 Macro B 與銑床 G／M 指令，查看語法、範例及 G65 引數對照，收藏常用條目。',
      url: 'tools/fanuc-macro/index.html',
      icon: 'code',
      tags: ['FANUC', 'Macro B', 'G-code', 'M-code', '離線查找'],
      source: '個人工具・原廠資料索引'
    },
    {
      id: 'machining-calculator',
      title: '加工計算工具箱',
      category: 'CNC 加工',
      description: '加工參數計算、螺紋資料與 ISO 孔軸公差查表，支援公英制換算與常用收藏。',
      url: 'tools/machining-calculator/index.html',
      icon: 'calculator',
      tags: ['轉速', '進給', '螺紋資料', 'ISO 公差', '公英制'],
      source: '個人工具・加工計算'
    }
  ],
  // ── 01｜個人資料：聯絡網址使用完整 HTTPS 網址，Email 只填信箱。 ──
  profile: {
    name: 'Louis Li',
    role: '產品管理部工程師',
    headline: '把現場問題，整理成可用的方法。',
    intro: '我在製造業做技術支援，也把加工經驗轉成數位工具。最近正在設計公司外銷的技術支援網站，讓刀具資料與加工方法更容易被理解、被使用。',
    email: 'louis962911@gmail.com',
    github: 'https://github.com/Ulysses-Li',
    website: 'https://cwli.dev',
    line: 'https://line.me/ti/p/P0eXqNnDh-'
  },
  // ── 02｜代表作互動展示：image 使用本機圖片路徑，url 指向對應的正式功能頁。 ──
  // id 對應展示切換項目；更新畫面時保留檔名，或同步修改 image 路徑。
  showcase: [
    {
      id: 'portal',
      label: '技術入口',
      title: '讓客戶找到下一步',
      description: '產品、切削資料與技術資源的整合入口',
      image: 'assets/support-center-home.png',
      url: 'https://n9sp.cwli.dev/index.html'
    },
    {
      id: 'cutting',
      label: '切削工作台',
      title: '把加工條件變成可操作介面',
      description: 'ACE Spot Drill 的切削設定與即時結果',
      image: 'assets/support-center-ace.png',
      url: 'https://n9sp.cwli.dev/CuttingData/AceSpotDrill/index.html'
    },
    {
      id: 'nc',
      label: 'NC 程式工具',
      title: '讓程式與刀路一起被理解',
      description: '螺紋銑削 V2 的參數設定與雙視圖',
      image: 'assets/support-center-nc.png',
      url: 'https://n9sp.cwli.dev/NCProgram/Thread_Milling_V2/index.html'
    }
  ],
  // ── 03｜專業能力：title 為中文定位，english 為領域名稱，tags 為技術標籤。 ──
  competencies: [
    {
      title: '從加工條件找問題',
      english: 'CNC / CAM',
      description: '協助加工流程、刀路、夾治具、效率改善與現場問題分析。關注從程式規劃到現場執行之間，哪些條件會影響結果。',
      tags: ['CNC Milling', '3 / 4 / 5 Axis', 'hyperMILL', 'Mastercam']
    },
    {
      title: '讓刀具選型有依據',
      english: 'Tool Application',
      description: '以 Nine-9 刀具應用為主，整理倒角、去毛刺、孔加工與螺紋銑削的需求，協助選型與應用討論。',
      tags: ['Nine-9', '倒角與去毛刺', '孔加工', '螺紋銑削']
    },
    {
      title: '把工作需求做成工具',
      english: 'Web Development',
      description: '用 HTML、Bootstrap、JavaScript 與 Firebase 製作實用工具，將資訊整理、操作流程與工作上的需求連結起來。',
      tags: ['HTML', 'Bootstrap', 'JavaScript', 'Firebase', 'GitHub']
    },
    {
      title: '把 AI 放進實際流程',
      english: 'AI Workflow',
      description: '把 AI 用在翻譯、文件整理、選型流程與工作效率提升；重視輸入資料、人工核對與成果能否回到實際工作。',
      tags: ['翻譯', '文件整理', '選型流程', '人工核對']
    }
  ],
  // ── 04｜作品案例：status 說明進度；背景、方法、證據與下一步分欄保存。 ──
  // url 可使用 HTTPS 網址，或 #home 這類站內頁面網址；id 用於 #work/作品代號。
  projects: [
    {
      id: 'support-center',
      featured: true,
      highlights: ['需求與流程規劃', '加工知識整理', '迭代驗收'],
      previewTitle: 'NINE9 / SUPPORT CENTER',
      previewIds: ['portal', 'cutting', 'nc'],
      title: 'Nine9 Support Center',
      category: '外銷技術支援網站',
      summary: '為公司外銷技術支援設計的網站，整合產品分類、切削資料與 NC 程式工具，讓加工資訊能在同一個入口查找與操作。',
      url: 'https://n9sp.cwli.dev/index.html',
      status: '持續開發中',
      context: '將公司外銷技術支援所需的產品與加工資訊整理成網站，連結刀具應用知識、型錄資料與實際操作流程。',
      role: '需求主導、加工知識整理、操作流程規劃與迭代驗收。將現場條件與原廠確認資訊轉成介面需求，持續檢視選型、加工幾何及手機操作的呈現方式。',
      approach: '以產品分類建立入口，將型錄內容結構化；在 ACE Spot Drill 工作台呈現點鑽與倒角幾何，並以螺紋銑削 V2 工具提供參數設定、雙視圖、中英介面與 NC 程式下載。',
      evidence: '正式入口可查看產品分類、切削資料與 NC 工具；ACE Spot Drill 與螺紋銑削 V2 頁面可查看對應的互動介面。',
      nextStep: '持續整合產品資料與技術支援流程，補充來源與適用條件，並依實際使用情境整理後續驗證紀錄。',
      tags: ['外銷技術支援', '型錄資料結構化', '切削工作台', 'NC 程式工具', '中英介面']
    },
    {
      id: 'engineering-notebook',
      // 本站實際首頁截圖；更新視覺時可替換同名圖片。
      cover: 'assets/personal-site-preview.jpg',
      coverAlt: 'Louis Li 個人網站首頁：自我介紹與 Support Center 作品展示',
      title: '個人工程履歷與技術知識庫',
      category: '個人網站',
      summary: '整合個人介紹、作品案例、可搜尋與分類的技術索引，以及可列印履歷，作為持續維護的個人網站。',
      url: '#home',
      status: '第一版・持續建置',
      context: '需要長期保存轉職履歷、作品與技術整理，讓面試展示與日常知識累積能在同一個網站持續更新。',
      approach: '以獨立的個人介紹、作品案例、知識索引與履歷建立資訊架構；採用純 HTML、CSS 與 JavaScript，將內容資料與版面分離。',
      evidence: '本版本提供頁面導航、案例檢視、知識搜尋與分類，以及履歷列印入口，可直接操作查看。',
      nextStep: '持續補入真實經歷、可追溯的量測成果與案例截圖；權限與儲存方式依日後需求增補。',
      tags: ['個人履歷', '作品集', '技術知識庫', 'HTML / CSS / JavaScript']
    },
    {
      id: 'personal-website',
      title: '個人網站',
      category: 'Web 開發',
      summary: '既有連結頁列出的個人網站與作品入口；在這裡逐步累積能說明問題、做法與結果的案例。',
      url: 'https://cwli.dev',
      status: '既有入口・案例待補',
      context: '既有頁面將此網址標示為「個人網站與作品入口」。目前僅確認連結資料，尚未檢視該網站內容與功能。',
      approach: '案例補充方向：從資訊架構、內容維護方式與使用者要完成的任務，說明網站如何支援個人展示。',
      evidence: '已確認的依據是既有 links 頁中的網址與介紹；畫面、實作範圍及驗證紀錄尚未收錄。',
      nextStep: '補上首頁畫面、本人負責的實作內容、一次具體調整前後的說明，以及可公開的原始碼。',
      tags: ['個人網站', '作品入口', '資訊整理']
    },
    {
      id: 'study',
      title: 'Study',
      category: 'Web 開發',
      summary: '既有連結頁列出的學習平台與筆記工具入口，後續以實際學習情境說明設計與使用方式。',
      url: 'https://study.cwli.dev',
      status: '既有入口・案例待補',
      context: '既有頁面將此網址標示為「學習平台與筆記工具」。目前僅確認這項描述，尚未檢視網站功能。',
      approach: '案例補充方向：選一個真實的學習任務，整理資訊如何輸入、分類、查找，以及如何再次使用。',
      evidence: '已確認的依據是既有 links 頁中的網址與介紹；功能清單、資料保存方式及使用成果尚未收錄。',
      nextStep: '補上一段實際操作流程與代表畫面，交代已完成的功能、限制，以及後續迭代的理由。',
      tags: ['學習整理', '筆記工具', '工作流程']
    },
    {
      id: 'cnc-tools',
      title: 'CNC Tools',
      category: '刀具應用',
      summary: '既有連結頁列出的刀具選型與加工計算工具入口，後續以可核對的工程案例說明適用範圍。',
      url: 'https://test.cwli.dev',
      status: '既有入口・案例待補',
      context: '既有頁面將此網址標示為「刀具選型與加工計算工具」。目前尚未檢視計算項目、公式或工具選型邏輯。',
      approach: '案例補充方向：從使用者輸入、單位與前提條件出發，交代判斷或計算的依據，以及如何人工核對。',
      evidence: '已確認的依據是既有 links 頁中的網址與介紹；公式來源、測試輸入與輸出結果尚未收錄。',
      nextStep: '補上一個可公開的計算或選型案例，附來源、單位、驗證方式與使用限制，再說明工具的價值。',
      tags: ['刀具選型', '加工計算', '工程工具']
    }
  ],
  // ── 05｜技術筆記：category 產生分類，tags 加入搜尋，sections 保存文章段落。 ──
  // 每段包含 heading（小標）與 body（內文）；id 用於 #notes/主題代號。
  knowledge: [
    {
      id: 'cnc-problem-record',
      title: '現場加工問題，怎麼留下可追查的紀錄',
      category: 'CNC / CAM',
      description: '整理範本｜從異常現象、加工條件與驗證紀錄，建立下一次能用得上的問題分析。',
      tags: ['整理範本', '現場分析', '驗證紀錄'],
      sections: [
        {
          heading: '先把現象與條件分開',
          body: '選一件能公開的現場問題。記錄實際看到的現象、發生工序、工件材質、機台、刀具與裝夾條件。哪些是量測或觀察到的事實，哪些仍是推測？對不能公開的資訊做匿名化處理。'
        },
        {
          heading: '留下每一次調整的理由',
          body: '依時間列出做過的檢查與調整。每一步想排除什麼原因？一次改了哪些條件？保留照片、量測或程式片段，並說明紀錄所對應的加工階段。'
        },
        {
          heading: '寫出結論與適用邊界',
          body: '哪些證據支持最後的判斷？問題是否重現、是否在相同條件下驗證？把仍未排除的因素與下次檢查順序一起留下，避免將單次成功當作通則。'
        }
      ]
    },
    {
      id: 'cam-review-checklist',
      title: '從 CAM 規劃到上機前的檢查筆記',
      category: 'CNC / CAM',
      description: '整理範本｜用一個實際零件，串起加工順序、刀路考量與上機前確認事項。',
      tags: ['整理範本', '刀路規劃', '上機確認'],
      sections: [
        {
          heading: '交代規劃的起點',
          body: '挑選一個可公開的零件或自行建立的示例。寫下加工目標、重要特徵、毛胚與裝夾限制。哪些需求影響粗加工、精加工與換面的安排？'
        },
        {
          heading: '說明刀路選擇的依據',
          body: '整理實際使用的軟體、策略與加工順序，附上可辨識重點的畫面。說明選擇理由、曾考慮的替代方案，以及需特別確認的干涉、進退刀與殘料位置。'
        },
        {
          heading: '把模擬與現場確認分開記錄',
          body: '記下已完成的模擬檢查，以及仍需依現場程序確認的事項。若有上機結果，附上觀察或量測依據；尚未上機的部分直接標示，讓讀者知道驗證到哪一步。'
        }
      ]
    },
    {
      id: 'chamfer-deburr-selection',
      title: '倒角與去毛刺：先問清楚哪些條件',
      category: '刀具應用',
      description: '整理範本｜把需求問完整，再記錄選型理由與實際加工後的確認方式。',
      tags: ['整理範本', 'Nine-9', '倒角', '去毛刺'],
      sections: [
        {
          heading: '把需求轉成可確認的條件',
          body: '以一個真實問題為例：要處理哪一條邊、什麼材質、可接近方向與空間如何？品質要求是尺寸、外觀、觸感，還是圖面另有規範？把需求來源一併記錄。'
        },
        {
          heading: '留下選型與資料來源',
          body: '列出實際比較過的刀具型式及選擇理由，標記對應型錄、規格版本或供應商建議。若提及參數，使用可追溯的來源並註明適用條件，不憑印象補數值。'
        },
        {
          heading: '用加工結果回頭檢查',
          body: '整理試作後的照片、量測方法與結果。需求是否達成？哪些位置仍有毛刺、干涉或一致性問題？記錄下一次選型可以直接沿用的判斷，以及不能直接套用的限制。'
        }
      ]
    },
    {
      id: 'thread-milling-application',
      title: '螺紋銑削應用紀錄的基本架構',
      category: '刀具應用',
      description: '整理範本｜串起螺紋需求、刀具資料、程式確認與檢驗結果，讓案例有完整依據。',
      tags: ['整理範本', '螺紋銑削', '選型紀錄'],
      sections: [
        {
          heading: '先定義螺紋與工件需求',
          body: '記錄圖面所要求的螺紋規格、公差、有效深度、通孔或盲孔，以及工件材質。將圖面要求、現場量測與尚待確認的資訊分別標示。'
        },
        {
          heading: '說明刀具與程式如何核對',
          body: '附上實際採用的刀具型號與可追溯的資料來源。整理刀具適用範圍、伸出限制及程式確認方式；若引用廠商程式或建議，交代版本與現場需確認的條件。'
        },
        {
          heading: '記錄檢驗與修正過程',
          body: '寫下使用的檢驗工具、判定依據與檢驗結果。若曾補正，說明觸發原因、調整項目與後續核對結果；沒有實際量測資料的部分保留為未驗證。'
        }
      ]
    },
    {
      id: 'workflow-to-web-tool',
      title: '把重複工作轉成小型 Web 工具',
      category: 'Web 開發',
      description: '整理範本｜從一段真實工作流程出發，說明需求如何落成操作介面與功能。',
      tags: ['整理範本', '需求整理', 'JavaScript'],
      sections: [
        {
          heading: '描述使用前的工作方式',
          body: '找一段反覆進行的工作，寫下使用者、輸入資料、操作步驟與預期輸出。哪些步驟容易出錯或需要反覆查找？先用一個具體情境說清楚問題。'
        },
        {
          heading: '把功能與需求對起來',
          body: '列出已實作的功能，逐一說明它支援哪個步驟。附上操作畫面或可公開的程式片段，交代使用 HTML、Bootstrap、JavaScript 等工具的理由，以及資料如何流動。'
        },
        {
          heading: '留下驗證與取捨',
          body: '用一組可公開的輸入走完整段流程，核對輸出是否符合需求。記下處理過的例外情況、尚未支援的場景，以及下一次修改的依據；有量測才填入節省時間等數據。'
        }
      ]
    },
    {
      id: 'web-data-maintenance',
      title: '網站資料怎麼存，之後才容易維護',
      category: 'Web 開發',
      description: '整理範本｜整理一個實際專案的資料結構、儲存方式與維護流程。',
      tags: ['整理範本', '資料結構', 'Firebase'],
      sections: [
        {
          heading: '從實際資料開始',
          body: '選一個已有實作的專案，列出它需要保存的資料、欄位與資料之間的關係。哪些欄位必填、哪些可以缺省？用匿名或示例資料展示格式，避免帶入個人或公司機密。'
        },
        {
          heading: '交代儲存方式與操作權限',
          body: '說明該專案實際採用的儲存方式；若使用 Firebase，再交代使用的服務與讀寫流程。誰能讀、誰能改、如何驗證？僅描述已實作或已核對的行為。'
        },
        {
          heading: '把維護步驟也寫進來',
          body: '記錄新增資料、修改欄位、備份與復原的實際步驟。挑一次曾遇到的資料問題，說明如何發現與修正；尚未完成的防護或維護功能清楚列為後續工作。'
        }
      ]
    },
    {
      id: 'technical-translation-review',
      title: '技術翻譯工作流：產出之後怎麼核對',
      category: 'AI 工作流',
      description: '整理範本｜留下來源、術語、提示與人工修訂，讓技術翻譯能追查。',
      tags: ['整理範本', '技術翻譯', '人工核對'],
      sections: [
        {
          heading: '先界定材料與讀者',
          body: '選一段有權使用且可公開的技術文本，交代來源、使用情境與目標讀者。列出需要固定的產品名稱、術語與單位，以及不得自行補充或改寫的內容。'
        },
        {
          heading: '記錄提示與修訂',
          body: '保留實際使用的提示、工具與產出日期，挑出值得說明的翻譯片段。原文、初稿與人工修訂分開展示，說明為何修正，並留下可查核的術語依據。'
        },
        {
          heading: '整理可重複使用的核對清單',
          body: '依案例整理常見問題：數值與單位是否一致、否定與條件是否保留、專有名詞是否統一、語意是否改變。記錄人工確認到哪裡，以及仍需專業人員判斷的部分。'
        }
      ]
    },
    {
      id: 'ai-document-to-action',
      title: '讓文件整理結果接得上下一步工作',
      category: 'AI 工作流',
      description: '整理範本｜從來源文件到摘要、欄位與待辦，保留每一個判斷的出處。',
      tags: ['整理範本', '文件整理', '流程改善'],
      sections: [
        {
          heading: '先定義整理完要做什麼',
          body: '選一項實際文件工作，說明整理結果要支援的決策或操作。需要摘要、比較表、欄位擷取，還是待辦？先設定輸出格式，並確認來源資料適合使用所選工具處理。'
        },
        {
          heading: '保留來源與不確定資訊',
          body: '展示一段實際提示與匿名化的輸出範例。每一項關鍵結論能否回到原文的位置？缺漏、衝突與模型推測應如何標示？說明人工補查與修訂的步驟。'
        },
        {
          heading: '用一次完整任務檢查成果',
          body: '把整理結果帶回下一個工作步驟，記錄哪些內容能直接使用、哪些仍需重整。若有比較資料，交代比較方式；沒有數據時，用具體操作差異說明改善，避免估算成果。'
        }
      ]
    }
  ],
  // ── 06｜履歷摘要：summary 為簡介，skills 為技術清單，gaps 為待確認的資料。 ──
  resume: {
    summary: '產品管理部工程師，專長方向涵蓋 CNC / CAM 技術支援、Nine-9 刀具應用、Web 工具開發與 AI 工作流。將加工現場經驗、刀具應用與數位工具整合，協助理解問題、選擇方法與改善流程。',
    skills: [
      'CNC Milling',
      '3 / 4 / 5 Axis',
      'hyperMILL',
      'Mastercam',
      'Nine-9 刀具應用',
      'HTML',
      'Bootstrap',
      'JavaScript',
      'Firebase',
      'GitHub',
      'AI Workflow'
    ],
    gaps: [
      '任職公司、任職期間與各階段職責，需依本人可公開的實際經歷補充。',
      '學歷、證照與其他資格，需有可確認的資料後再收錄。',
      '代表案例需補上本人負責範圍、實作證據與驗證結果。',
      '年資、量化成果與改善幅度，需以可追溯的紀錄確認後再使用。'
    ]
  }
};
