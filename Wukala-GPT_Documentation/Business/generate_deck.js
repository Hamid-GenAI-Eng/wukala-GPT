const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icon rendering helpers
const { FaBalanceScale, FaRobot, FaUsers, FaMoneyBillWave, FaChartLine, FaGavel, FaFileAlt, FaSearch, FaMicrophone, FaLayerGroup, FaBrain, FaShieldAlt, FaRocket, FaEnvelope } = require("react-icons/fa");
const { MdAutoAwesome, MdLanguage, MdSpeed } = require("react-icons/md");

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// === PALETTE ===
// Deep Navy dominant, Gold accent, White text, Light slate backgrounds
const C = {
  navy:    "0D1B2A",
  navyMid: "1A3050",
  gold:    "C9A84C",
  goldLight:"F0D080",
  white:   "FFFFFF",
  offWhite:"F4F6FA",
  slate:   "E8ECF3",
  muted:   "8A9BB5",
  dark:    "07111E",
  teal:    "1B7A6E",
  tealLight:"25A898",
  red:     "C0392B",
};

const makeShadow = () => ({ type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.18 });

async function buildDeck() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Code Envision Technologies";
  pres.title = "WukalaGPT — Investor Pitch Deck";

  // ─────────────────────────────────────────────────
  // SLIDE 1: COVER
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Gold top bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });

    // Left accent block
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.07, w: 0.35, h: 5.555, fill: { color: C.navyMid }, line: { color: C.navyMid } });

    // Scale icon
    const scaleIcon = await iconToBase64Png(FaBalanceScale, "#C9A84C", 512);
    s.addImage({ data: scaleIcon, x: 0.7, y: 0.85, w: 1.1, h: 1.1 });

    // Brand name
    s.addText("WukalaGPT", {
      x: 0.6, y: 1.9, w: 5.5, h: 0.85,
      fontSize: 52, bold: true, color: C.white,
      fontFace: "Georgia", margin: 0
    });

    // Tagline
    s.addText("Precision Legal Intelligence for the Modern Wakeel", {
      x: 0.6, y: 2.78, w: 6.0, h: 0.55,
      fontSize: 16, italic: true, color: C.gold,
      fontFace: "Calibri", margin: 0
    });

    // Divider line
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.42, w: 5.5, h: 0.03, fill: { color: C.gold }, line: { color: C.gold } });

    // One-liner
    s.addText("Pakistan's first bilingual AI-powered legal practice platform — built for 180,000+ lawyers.", {
      x: 0.6, y: 3.55, w: 6.5, h: 0.65,
      fontSize: 13, color: C.muted, fontFace: "Calibri", margin: 0
    });

    // Company + date
    s.addText("Code Envision Technologies  ·  Seed Round 2025  ·  Confidential", {
      x: 0.6, y: 5.0, w: 7, h: 0.35,
      fontSize: 10, color: C.muted, fontFace: "Calibri", margin: 0
    });

    // Right side: vertical label
    s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: 1.2, w: 1.5, h: 3.2, fill: { color: C.navyMid }, line: { color: C.navyMid }, shadow: makeShadow() });
    s.addText("SEED ROUND", {
      x: 8.3, y: 1.2, w: 1.5, h: 3.2,
      fontSize: 11, bold: true, color: C.gold,
      fontFace: "Calibri", align: "center", valign: "middle",
      rotate: 270, margin: 0
    });
  }

  // ─────────────────────────────────────────────────
  // SLIDE 2: THE PROBLEM
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    // Left panel (dark)
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.0, h: 5.625, fill: { color: C.navy }, line: { color: C.navy } });

    // Slide label
    s.addText("THE PROBLEM", {
      x: 0.3, y: 0.3, w: 3.4, h: 0.4,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, margin: 0
    });

    s.addText("Pakistan has 180,000+ practicing lawyers.", {
      x: 0.3, y: 0.9, w: 3.4, h: 0.8,
      fontSize: 18, bold: true, color: C.white,
      fontFace: "Georgia", margin: 0
    });

    s.addText("Most of them are still working the same way they did in 1985.", {
      x: 0.3, y: 1.85, w: 3.4, h: 0.9,
      fontSize: 13, color: C.muted,
      fontFace: "Calibri", margin: 0
    });

    // Pain point icon
    const gavelIcon = await iconToBase64Png(FaGavel, "#C9A84C", 256);
    s.addImage({ data: gavelIcon, x: 1.4, y: 3.5, w: 1.2, h: 1.2 });

    // Right panel: pain cards
    const pains = [
      { icon: FaSearch,   title: "Case Research Takes Days",   desc: "Lawyers manually sift through thousands of judgments. There is no intelligent search — just Google and prayer." },
      { icon: FaFileAlt,  title: "Document Drafting is Guesswork", desc: "Every petition, agreement, or plaint is drafted from scratch or copied from outdated templates with no legal accuracy check." },
      { icon: MdLanguage, title: "English-Only Tools Fail in Pakistan", desc: "Legal work happens in Urdu, Punjabi, and regional languages. Every existing tool assumes English fluency — excluding the majority." },
      { icon: FaLayerGroup, title: "No Unified Practice Management", desc: "Cases, clients, hearings, billings — all managed in notebooks, WhatsApp groups, and Excel sheets." },
    ];

    for (let i = 0; i < pains.length; i++) {
      const yPos = 0.3 + i * 1.25;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 4.25, y: yPos, w: 5.5, h: 1.1,
        fill: { color: C.white }, line: { color: C.slate, pt: 1 },
        shadow: makeShadow()
      });
      // gold left accent
      s.addShape(pres.shapes.RECTANGLE, {
        x: 4.25, y: yPos, w: 0.06, h: 1.1,
        fill: { color: C.gold }, line: { color: C.gold }
      });
      const iconData = await iconToBase64Png(pains[i].icon, "#C9A84C", 256);
      s.addImage({ data: iconData, x: 4.4, y: yPos + 0.3, w: 0.45, h: 0.45 });
      s.addText(pains[i].title, {
        x: 4.95, y: yPos + 0.1, w: 4.65, h: 0.35,
        fontSize: 12, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
      });
      s.addText(pains[i].desc, {
        x: 4.95, y: yPos + 0.45, w: 4.65, h: 0.55,
        fontSize: 10, color: "555555", fontFace: "Calibri", margin: 0
      });
    }
  }

  // ─────────────────────────────────────────────────
  // SLIDE 3: THE SOLUTION
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("THE SOLUTION", {
      x: 0.5, y: 0.25, w: 9, h: 0.38,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, align: "center", margin: 0
    });

    s.addText("WukalaGPT — One Platform. Every Workflow.", {
      x: 0.5, y: 0.68, w: 9, h: 0.65,
      fontSize: 28, bold: true, color: C.white,
      fontFace: "Georgia", align: "center", margin: 0
    });

    s.addText("We combine AI-powered case intelligence, bilingual legal research, automated document drafting,\nand practice management into a single product built ground-up for the Pakistani legal system.", {
      x: 0.8, y: 1.38, w: 8.4, h: 0.7,
      fontSize: 12, color: C.muted, fontFace: "Calibri", align: "center", margin: 0
    });

    const features = [
      { icon: FaBrain,      label: "MizanAI Engine",        desc: "Multi-agent RAG system trained on Pakistani court judgments from LHC, SHC, PHC, and Supreme Court." },
      { icon: MdLanguage,   label: "Bilingual Interface",   desc: "Full Urdu & English support — voice input, document output, and chat in the lawyer's native language." },
      { icon: FaFileAlt,    label: "Smart Doc Drafting",    desc: "Generate petitions, agreements, and legal notices in seconds using jurisdiction-specific AI templates." },
      { icon: FaMicrophone, label: "Voice-First Design",    desc: "Speak your case notes. Dictate in Urdu. WukalaGPT transcribes, summarizes, and files automatically." },
      { icon: FaSearch,     label: "Deep Research Tool",    desc: "Instant case law retrieval with cited precedents — no subscriptions, no manual search, no noise." },
      { icon: FaShieldAlt,  label: "Secure & Compliant",    desc: "RBAC access control, encrypted client data, and audit trails built for professional legal environments." },
    ];

    for (let i = 0; i < features.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.4 + col * 3.1;
      const y = 2.25 + row * 1.55;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.9, h: 1.35,
        fill: { color: C.navyMid }, line: { color: "1E3A5F", pt: 1 },
        shadow: makeShadow()
      });

      const iconData = await iconToBase64Png(features[i].icon, "#C9A84C", 256);
      s.addImage({ data: iconData, x: x + 0.15, y: y + 0.18, w: 0.42, h: 0.42 });

      s.addText(features[i].label, {
        x: x + 0.65, y: y + 0.15, w: 2.1, h: 0.38,
        fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0
      });
      s.addText(features[i].desc, {
        x: x + 0.12, y: y + 0.62, w: 2.65, h: 0.65,
        fontSize: 9.5, color: C.muted, fontFace: "Calibri", margin: 0
      });
    }
  }

  // ─────────────────────────────────────────────────
  // SLIDE 4: MARKET OPPORTUNITY
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: C.navy }, line: { color: C.navy } });

    s.addText("MARKET OPPORTUNITY", {
      x: 0.5, y: 0.12, w: 9, h: 0.32,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, margin: 0
    });
    s.addText("A legal sector that generates billions — and has never been touched by modern technology.", {
      x: 0.5, y: 0.48, w: 9, h: 0.42,
      fontSize: 14, color: C.white, fontFace: "Calibri", margin: 0
    });

    // Stat boxes
    const stats = [
      { num: "180,000+", label: "Practicing Lawyers", sub: "Registered with Bar Councils across Pakistan" },
      { num: "$2.1B+",   label: "Legal Services TAM", sub: "Pakistan's annual legal services market size" },
      { num: "~3%",      label: "Digital Penetration", sub: "Fraction of lawyers using any digital tooling today" },
      { num: "87%",      label: "SME Law Firms",       sub: "Solo or small-firm lawyers — our primary beachhead" },
    ];

    for (let i = 0; i < stats.length; i++) {
      const x = 0.35 + i * 2.35;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.3, w: 2.15, h: 2.4,
        fill: { color: C.white }, line: { color: C.slate, pt: 1 },
        shadow: makeShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.3, w: 2.15, h: 0.07,
        fill: { color: C.gold }, line: { color: C.gold }
      });
      s.addText(stats[i].num, {
        x, y: 1.5, w: 2.15, h: 0.75,
        fontSize: 30, bold: true, color: C.navy,
        fontFace: "Georgia", align: "center", margin: 0
      });
      s.addText(stats[i].label, {
        x, y: 2.3, w: 2.15, h: 0.42,
        fontSize: 11, bold: true, color: C.navy,
        fontFace: "Calibri", align: "center", margin: 0
      });
      s.addText(stats[i].sub, {
        x: x + 0.12, y: 2.75, w: 1.9, h: 0.75,
        fontSize: 9.5, color: "666666",
        fontFace: "Calibri", align: "center", margin: 0
      });
    }

    // SAM/SOM note
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y: 3.9, w: 9.3, h: 1.45,
      fill: { color: C.navy }, line: { color: C.navy },
      shadow: makeShadow()
    });
    s.addText([
      { text: "SAM: ", options: { bold: true, color: C.gold } },
      { text: "~45,000 digitally-active lawyers in urban centers (Lahore, Karachi, Islamabad, Peshawar, Quetta)   ", options: { color: C.white } },
      { text: "SOM: ", options: { bold: true, color: C.gold } },
      { text: "Conservative 5% capture = 2,250 paying accounts in Year 1. At PKR 2,500/month average = PKR 67.5M ARR by end of Year 1.", options: { color: C.white } },
    ], {
      x: 0.65, y: 3.98, w: 8.8, h: 1.2,
      fontSize: 11, fontFace: "Calibri", margin: 0
    });
  }

  // ─────────────────────────────────────────────────
  // SLIDE 5: PRODUCT — HOW IT WORKS
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("HOW IT WORKS", {
      x: 0.5, y: 0.25, w: 9, h: 0.38,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, align: "center", margin: 0
    });
    s.addText("MizanAI — The Intelligence Layer Behind WukalaGPT", {
      x: 0.5, y: 0.68, w: 9, h: 0.5,
      fontSize: 22, bold: true, color: C.white,
      fontFace: "Georgia", align: "center", margin: 0
    });

    // Flow diagram: 5 steps
    const steps = [
      { label: "Lawyer Inputs Query", sub: "Urdu or English\nVoice or Text", icon: FaMicrophone },
      { label: "MizanAI Understands", sub: "BGE-M3 Embeddings\nSemantic + Contextual", icon: FaBrain },
      { label: "Searches Judgment DB", sub: "Qdrant Vector Store\nNeo4j Graph Links", icon: FaSearch },
      { label: "Agent Synthesizes", sub: "LangGraph Multi-Agent\nChain-of-Thought", icon: FaRobot },
      { label: "Delivers Output", sub: "Draft Doc / Research\nBilingual Summary", icon: FaFileAlt },
    ];

    for (let i = 0; i < steps.length; i++) {
      const x = 0.3 + i * 1.88;

      // Circle background
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.44, y: 1.42, w: 1.0, h: 1.0,
        fill: { color: i === 2 ? C.gold : C.navyMid }, line: { color: i === 2 ? C.goldLight : "2A4570", pt: 2 }
      });

      const iconData = await iconToBase64Png(steps[i].icon, i === 2 ? "#0D1B2A" : "#C9A84C", 256);
      s.addImage({ data: iconData, x: x + 0.62, y: 1.6, w: 0.65, h: 0.65 });

      // Arrow between steps
      if (i < 4) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: x + 1.44, y: 1.87, w: 0.45, h: 0.08,
          fill: { color: C.gold }, line: { color: C.gold }
        });
      }

      s.addText(steps[i].label, {
        x: x, y: 2.6, w: 1.88, h: 0.42,
        fontSize: 10, bold: true, color: C.white,
        fontFace: "Calibri", align: "center", margin: 0
      });
      s.addText(steps[i].sub, {
        x: x, y: 3.05, w: 1.88, h: 0.5,
        fontSize: 8.5, color: C.muted,
        fontFace: "Calibri", align: "center", margin: 0
      });
    }

    // Tech stack strip
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: 3.8, w: 9.2, h: 1.55,
      fill: { color: C.dark }, line: { color: "1A3050", pt: 1 }
    });

    s.addText("TECHNOLOGY STACK", {
      x: 0.7, y: 3.9, w: 3, h: 0.3,
      fontSize: 9, bold: true, color: C.gold, charSpacing: 2, fontFace: "Calibri", margin: 0
    });

    const techItems = [
      "FastAPI (Backend)",
      "React.js (Frontend)",
      "LangGraph (Orchestration)",
      "Qdrant (Vector DB)",
      "Neo4j (Knowledge Graph)",
      "Groq Whisper (STT)",
      "Azure TTS / Orpheus TTS",
      "PostgreSQL (Data Layer)",
      "LiteLLM Gateway (Multi-LLM)",
    ];

    for (let i = 0; i < techItems.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.65 + col * 3.05, y: 4.27 + row * 0.4, w: 2.75, h: 0.32,
        fill: { color: C.navyMid }, line: { color: "2A4570", pt: 1 }, rectRadius: 0.05
      });
      s.addText(techItems[i], {
        x: 0.65 + col * 3.05, y: 4.27 + row * 0.4, w: 2.75, h: 0.32,
        fontSize: 9, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
      });
    }
  }

  // ─────────────────────────────────────────────────
  // SLIDE 6: TRACTION
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: C.teal }, line: { color: C.teal } });

    s.addText("TRACTION & MILESTONES", {
      x: 0.5, y: 0.12, w: 9, h: 0.32,
      fontSize: 10, bold: true, color: C.white,
      fontFace: "Calibri", charSpacing: 3, margin: 0
    });
    s.addText("We have not launched yet — but we have not been standing still.", {
      x: 0.5, y: 0.48, w: 9, h: 0.42,
      fontSize: 14, italic: true, color: "D0F0EC", fontFace: "Calibri", margin: 0
    });

    const milestones = [
      { done: true,  label: "Full MVP built",                  detail: "End-to-end product: case research, doc drafting, client management, voice interface — all functional." },
      { done: true,  label: "MizanAI RAG pipeline live",       detail: "Bilingual multi-agent system operational. BGE-M3 embeddings, Qdrant + Neo4j, LangGraph orchestration." },
      { done: true,  label: "Court judgment corpus harvested", detail: "Automated scraper collecting LHC, SHC, PHC, and Supreme Court judgments via Playwright — thousands of records indexed." },
      { done: true,  label: "FYP presented at USKT",           detail: "50% milestone presented. Full academic validation for the AI pipeline architecture." },
      { done: false, label: "Closed beta — 50 lawyers",        detail: "Outreach underway to Lahore and Islamabad bar council members. First cohort target: 50 practicing lawyers." },
      { done: false, label: "Bar council partnership",         detail: "Discussions initiated with Punjab Bar Council for institutional onboarding. MOU in progress." },
    ];

    for (let i = 0; i < milestones.length; i++) {
      const yPos = 1.2 + i * 0.71;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.3 + col * 4.85;
      const y = 1.2 + row * 1.35;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 4.6, h: 1.2,
        fill: { color: milestones[i].done ? C.white : "EEF3FA" },
        line: { color: milestones[i].done ? C.teal : C.slate, pt: milestones[i].done ? 2 : 1 },
        shadow: makeShadow()
      });

      // Status dot
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.2, y: y + 0.43, w: 0.35, h: 0.35,
        fill: { color: milestones[i].done ? C.teal : C.muted }, line: { color: milestones[i].done ? C.teal : C.muted }
      });

      s.addText(milestones[i].label, {
        x: x + 0.67, y: y + 0.1, w: 3.75, h: 0.38,
        fontSize: 11, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
      });
      s.addText(milestones[i].detail, {
        x: x + 0.67, y: y + 0.5, w: 3.75, h: 0.6,
        fontSize: 9.5, color: "555555", fontFace: "Calibri", margin: 0
      });
    }
  }

  // ─────────────────────────────────────────────────
  // SLIDE 7: BUSINESS MODEL
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("BUSINESS MODEL", {
      x: 0.5, y: 0.25, w: 9, h: 0.38,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, align: "center", margin: 0
    });
    s.addText("Simple, Scalable, Sticky Subscription Revenue", {
      x: 0.5, y: 0.68, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: C.white,
      fontFace: "Georgia", align: "center", margin: 0
    });

    const tiers = [
      {
        name: "Solo Practitioner",
        price: "PKR 1,999 / mo",
        usd: "~$7 USD",
        features: ["AI Case Research (50 queries/mo)", "Document Drafting (20 docs/mo)", "Client & Hearing Management", "Urdu/English Interface", "Email Support"],
        highlight: false,
      },
      {
        name: "Professional",
        price: "PKR 3,999 / mo",
        usd: "~$14 USD",
        features: ["Unlimited AI Research", "Unlimited Document Drafting", "Voice Input (Urdu/English)", "Advanced Analytics Dashboard", "Priority Support + Onboarding"],
        highlight: true,
      },
      {
        name: "Law Firm",
        price: "PKR 9,999 / mo",
        usd: "~$36 USD",
        features: ["Up to 10 Team Members", "Shared Case Database", "White-label Document Templates", "Dedicated Account Manager", "API Access for Integrations"],
        highlight: false,
      },
    ];

    for (let i = 0; i < tiers.length; i++) {
      const x = 0.45 + i * 3.1;
      const bgColor = tiers[i].highlight ? C.gold : C.navyMid;
      const textColor = tiers[i].highlight ? C.navy : C.white;
      const mutedColor = tiers[i].highlight ? "3A2800" : C.muted;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.35, w: 2.85, h: 4.0,
        fill: { color: bgColor }, line: { color: tiers[i].highlight ? C.goldLight : "2A4570", pt: 1 },
        shadow: makeShadow()
      });

      if (tiers[i].highlight) {
        s.addText("MOST POPULAR", {
          x, y: 1.35, w: 2.85, h: 0.3,
          fontSize: 8.5, bold: true, color: C.navy,
          fontFace: "Calibri", align: "center", valign: "middle", charSpacing: 1, margin: 0
        });
      }

      s.addText(tiers[i].name, {
        x: x + 0.15, y: 1.8, w: 2.55, h: 0.42,
        fontSize: 13, bold: true, color: textColor,
        fontFace: "Calibri", align: "center", margin: 0
      });
      s.addText(tiers[i].price, {
        x: x + 0.1, y: 2.25, w: 2.65, h: 0.48,
        fontSize: 18, bold: true, color: textColor,
        fontFace: "Georgia", align: "center", margin: 0
      });
      s.addText(tiers[i].usd, {
        x: x + 0.1, y: 2.76, w: 2.65, h: 0.28,
        fontSize: 10, color: mutedColor,
        fontFace: "Calibri", align: "center", margin: 0
      });

      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.15, y: 3.1, w: 2.55, h: 0.02,
        fill: { color: tiers[i].highlight ? C.navyMid : "2A4570" }, line: { color: tiers[i].highlight ? C.navyMid : "2A4570" }
      });

      for (let j = 0; j < tiers[i].features.length; j++) {
        s.addText("✓  " + tiers[i].features[j], {
          x: x + 0.2, y: 3.2 + j * 0.38, w: 2.45, h: 0.35,
          fontSize: 9.5, color: textColor, fontFace: "Calibri", margin: 0
        });
      }
    }

    s.addText("All users receive 30 days free — no credit card required.", {
      x: 0.5, y: 5.25, w: 9, h: 0.28,
      fontSize: 11, italic: true, color: C.muted,
      fontFace: "Calibri", align: "center", margin: 0
    });
  }

  // ─────────────────────────────────────────────────
  // SLIDE 8: COMPETITIVE LANDSCAPE
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.95, fill: { color: C.navy }, line: { color: C.navy } });
    s.addText("COMPETITIVE LANDSCAPE", {
      x: 0.5, y: 0.1, w: 9, h: 0.32,
      fontSize: 10, bold: true, color: C.gold, charSpacing: 3, fontFace: "Calibri", margin: 0
    });
    s.addText("We are not competing on features. We are competing on context.", {
      x: 0.5, y: 0.46, w: 9, h: 0.36,
      fontSize: 13, italic: true, color: "B0C8E8", fontFace: "Calibri", margin: 0
    });

    // Comparison table
    const headers = ["", "WukalaGPT", "DigiLawyer", "ChatGPT / GPT-4", "Manual / WhatsApp"];
    const rows = [
      ["Bilingual (Urdu + English)", "✓", "✗", "Partial", "✗"],
      ["Pakistani Case Law Training", "✓", "Partial", "✗", "✗"],
      ["Voice Input in Urdu", "✓", "✗", "✗", "✗"],
      ["Full Practice Management", "✓", "✗", "✗", "✗"],
      ["AI Document Drafting", "✓", "✗", "✓", "✗"],
      ["Affordable for Solo Lawyers", "✓", "✗", "Partial", "✓"],
    ];

    const colW = [2.6, 1.5, 1.5, 1.7, 1.8];
    const colX = [0.3, 2.9, 4.4, 5.9, 7.6];

    // Header row
    for (let c = 0; c < headers.length; c++) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: colX[c], y: 1.05, w: colW[c], h: 0.4,
        fill: { color: c === 1 ? C.gold : C.navy }, line: { color: c === 1 ? C.goldLight : "2A4570", pt: 1 }
      });
      s.addText(headers[c], {
        x: colX[c], y: 1.05, w: colW[c], h: 0.4,
        fontSize: 10, bold: true, color: c === 1 ? C.navy : C.white,
        fontFace: "Calibri", align: "center", valign: "middle", margin: 0
      });
    }

    for (let r = 0; r < rows.length; r++) {
      const yPos = 1.48 + r * 0.58;
      for (let c = 0; c < rows[r].length; c++) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: colX[c], y: yPos, w: colW[c], h: 0.55,
          fill: { color: r % 2 === 0 ? C.white : C.slate },
          line: { color: C.slate, pt: 1 }
        });
        const isCheck = rows[r][c] === "✓";
        const isCross = rows[r][c] === "✗";
        s.addText(rows[r][c], {
          x: colX[c], y: yPos, w: colW[c], h: 0.55,
          fontSize: c === 0 ? 10 : 13,
          bold: isCheck || isCross,
          color: isCheck ? C.teal : isCross ? C.red : C.navy,
          fontFace: "Calibri", align: "center", valign: "middle", margin: 0
        });
      }
    }

    s.addText("DigiLawyer — Rs.14 Crore funded (Shark Tank Pakistan / Zayn VC) — validates the market. We are the AI-native, bilingual, full-stack alternative.", {
      x: 0.3, y: 5.1, w: 9.4, h: 0.42,
      fontSize: 10, italic: true, color: "555555", fontFace: "Calibri", margin: 0
    });
  }

  // ─────────────────────────────────────────────────
  // SLIDE 9: TEAM
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("THE TEAM", {
      x: 0.5, y: 0.25, w: 9, h: 0.38,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 3, align: "center", margin: 0
    });
    s.addText("Small team. Deep expertise. No wasted motion.", {
      x: 0.5, y: 0.7, w: 9, h: 0.48,
      fontSize: 22, bold: true, color: C.white,
      fontFace: "Georgia", align: "center", margin: 0
    });

    const members = [
      {
        name: "Hamid Saifullah",
        role: "Co-Founder & Tech Lead",
        company: "Code Envision Technologies",
        bio: "UI/UX and Tech Lead at CET. Final-year BS Computer Science, University of Sialkot. Architect of MizanAI — the multi-agent RAG system powering WukalaGPT. Deep expertise in FastAPI, LangGraph, Qdrant, React.js, and full-stack AI. Built every layer of the product from embedding pipelines to voice interfaces.",
        skills: ["FastAPI · LangGraph · RAG", "React.js · PostgreSQL", "LiteLLM · Qdrant · Neo4j"],
      },
      {
        name: "Hafiz Abdullah",
        role: "Co-Founder & CEO",
        company: "Code Envision Technologies",
        bio: "Founder of Code Envision Technologies. Leads commercial strategy, client acquisition, and business operations at CET. Experienced in enterprise software delivery, Pakistan's tech market, and building client-facing products across legal, retail, and manufacturing verticals.",
        skills: ["Business Development", "Enterprise Sales · CET Operations", "Product Strategy"],
      },
    ];

    const userIcon = await iconToBase64Png(FaUsers, "#C9A84C", 256);

    for (let i = 0; i < members.length; i++) {
      const x = 0.5 + i * 4.75;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.35, w: 4.35, h: 4.0,
        fill: { color: C.navyMid }, line: { color: "2A4570", pt: 1 },
        shadow: makeShadow()
      });

      // Avatar placeholder
      s.addShape(pres.shapes.OVAL, {
        x: x + 1.6, y: 1.5, w: 1.15, h: 1.15,
        fill: { color: C.gold }, line: { color: C.goldLight, pt: 2 }
      });
      s.addImage({ data: userIcon, x: x + 1.78, y: 1.68, w: 0.8, h: 0.8 });

      s.addText(members[i].name, {
        x, y: 2.8, w: 4.35, h: 0.42,
        fontSize: 15, bold: true, color: C.white,
        fontFace: "Georgia", align: "center", margin: 0
      });
      s.addText(members[i].role, {
        x, y: 3.24, w: 4.35, h: 0.32,
        fontSize: 11, bold: true, color: C.gold,
        fontFace: "Calibri", align: "center", margin: 0
      });
      s.addText(members[i].company, {
        x, y: 3.58, w: 4.35, h: 0.28,
        fontSize: 9.5, color: C.muted,
        fontFace: "Calibri", align: "center", margin: 0
      });

      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.3, y: 3.93, w: 3.75, h: 0.02,
        fill: { color: "2A4570" }, line: { color: "2A4570" }
      });

      s.addText(members[i].bio, {
        x: x + 0.25, y: 4.02, w: 3.85, h: 0.88,
        fontSize: 9, color: C.muted, fontFace: "Calibri", margin: 0
      });

      for (let j = 0; j < members[i].skills.length; j++) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: x + 0.2, y: 4.98 + j * 0.0, w: 3.95, h: 0.28,
          fill: { color: C.dark }, line: { color: "2A4570", pt: 1 }, rectRadius: 0.05
        });
        s.addText(members[i].skills[j], {
          x: x + 0.2, y: 4.98 + j * 0.0, w: 3.95, h: 0.28,
          fontSize: 9, color: C.gold, fontFace: "Calibri", align: "center", valign: "middle", margin: 0
        });
      }
    }

    s.addText("Advisory conversations initiated with legal tech practitioners and practicing advocates in Lahore and Islamabad.", {
      x: 0.5, y: 5.3, w: 9, h: 0.25,
      fontSize: 9.5, italic: true, color: C.muted, fontFace: "Calibri", align: "center", margin: 0
    });
  }

  // ─────────────────────────────────────────────────
  // SLIDE 10: FINANCIALS & USE OF FUNDS
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: C.navy }, line: { color: C.navy } });
    s.addText("USE OF FUNDS", {
      x: 0.5, y: 0.12, w: 9, h: 0.32,
      fontSize: 10, bold: true, color: C.gold, charSpacing: 3, fontFace: "Calibri", margin: 0
    });
    s.addText("$150,000 seed round — 18-month runway to product-market fit.", {
      x: 0.5, y: 0.5, w: 9, h: 0.4,
      fontSize: 14, color: C.white, fontFace: "Calibri", margin: 0
    });

    const allocations = [
      { label: "Product & AI Infrastructure", pct: "40%", amt: "$60,000", desc: "LLM API costs, vector DB scaling, voice pipeline, server infra, and ongoing model fine-tuning.", color: C.teal },
      { label: "Sales & Marketing",           pct: "25%", amt: "$37,500", desc: "Bar council outreach, lawyer community events, digital marketing, and closed beta program.", color: C.gold },
      { label: "Team Hiring",                 pct: "20%", amt: "$30,000", desc: "1 full-stack engineer + 1 sales/support hire to accelerate delivery and customer onboarding.", color: "7B5EA7" },
      { label: "Legal & Compliance",          pct: "10%", amt: "$15,000", desc: "Data privacy compliance, IP protection, company structuring, and bar council partnership agreements.", color: "C0392B" },
      { label: "Operations & Contingency",    pct: "5%",  amt: "$7,500",  desc: "Office, tools, travel, and reserve for unexpected operational needs.", color: C.muted },
    ];

    for (let i = 0; i < allocations.length; i++) {
      const y = 1.22 + i * 0.86;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.3, y, w: 9.4, h: 0.78,
        fill: { color: C.white }, line: { color: C.slate, pt: 1 },
        shadow: makeShadow()
      });
      // Color bar (width proportional)
      const barW = parseFloat(allocations[i].pct) / 100 * 8.5;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.3, y, w: barW, h: 0.05,
        fill: { color: allocations[i].color }, line: { color: allocations[i].color }
      });
      s.addText(allocations[i].pct, {
        x: 0.35, y: y + 0.08, w: 0.65, h: 0.4,
        fontSize: 20, bold: true, color: allocations[i].color,
        fontFace: "Georgia", valign: "middle", margin: 0
      });
      s.addText(allocations[i].label, {
        x: 1.1, y: y + 0.08, w: 3.5, h: 0.3,
        fontSize: 11, bold: true, color: C.navy, fontFace: "Calibri", margin: 0
      });
      s.addText(allocations[i].amt, {
        x: 1.1, y: y + 0.4, w: 1.5, h: 0.28,
        fontSize: 10, color: allocations[i].color, fontFace: "Calibri", margin: 0
      });
      s.addText(allocations[i].desc, {
        x: 4.8, y: y + 0.1, w: 4.7, h: 0.55,
        fontSize: 9.5, color: "555555", fontFace: "Calibri", margin: 0
      });
    }
  }

  // ─────────────────────────────────────────────────
  // SLIDE 11: THE ASK
  // ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Gold top bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });
    // Gold bottom bar
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: C.gold }, line: { color: C.gold } });

    const rocketIcon = await iconToBase64Png(FaRocket, "#C9A84C", 512);
    s.addImage({ data: rocketIcon, x: 4.3, y: 0.5, w: 1.4, h: 1.4 });

    s.addText("THE ASK", {
      x: 0.5, y: 1.95, w: 9, h: 0.38,
      fontSize: 10, bold: true, color: C.gold,
      fontFace: "Calibri", charSpacing: 4, align: "center", margin: 0
    });

    s.addText("$150,000", {
      x: 0.5, y: 2.35, w: 9, h: 0.9,
      fontSize: 58, bold: true, color: C.white,
      fontFace: "Georgia", align: "center", margin: 0
    });

    s.addText("Seed Investment — Pre-Series A", {
      x: 0.5, y: 3.3, w: 9, h: 0.42,
      fontSize: 16, italic: true, color: C.gold,
      fontFace: "Calibri", align: "center", margin: 0
    });

    s.addText("In return: we offer equity at a valuation open for discussion. This round will fund 18 months of runway — taking WukalaGPT from MVP to 1,000+ active paying lawyers, a bar council partnership, and a Series A-ready revenue baseline.", {
      x: 1.2, y: 3.85, w: 7.6, h: 0.95,
      fontSize: 12, color: C.muted, fontFace: "Calibri", align: "center", margin: 0
    });

    // Contact
    const emailIcon = await iconToBase64Png(FaEnvelope, "#C9A84C", 256);
    s.addImage({ data: emailIcon, x: 3.6, y: 4.9, w: 0.32, h: 0.32 });
    s.addText("Code Envision Technologies  ·  WukalaGPT", {
      x: 0.5, y: 4.9, w: 9, h: 0.32,
      fontSize: 11, color: C.muted, fontFace: "Calibri", align: "center", margin: 0
    });
  }

  await pres.writeFile({ fileName: "WukalaGPT_Pitch_Deck_IVC.pptx" });
  console.log("Done.");
}

buildDeck().catch(console.error);
