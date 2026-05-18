/**
 * Global Stock Exchanges & Market Segments Intelligence Agent
 *
 * Structured reference data for the world's major stock exchanges, their listing
 * boards, market tiers, growth markets, OTC quotation tiers and associated indices.
 *
 * Source: WFE Market Statistics May 2026, LSEG, LSE, FCA, Nasdaq, NYSE,
 * OTC Markets, Euronext, Deutsche Börse, JPX, HKEX, SGX, Saudi Exchange and
 * other official exchange materials. Figures rounded; move daily.
 */

export const EXCHANGE_DATA_AS_OF = 'May 2026';

export interface MarketSegment {
  name: string;
  tier: 'main' | 'growth' | 'sme' | 'otc' | 'index' | 'professional';
  description: string;
  notes: string;
}

export interface ExchangeInfo {
  /** Short code(s) used to identify the exchange (Yahoo Finance / ISO MIC style) */
  codes: string[];
  name: string;
  region: string;
  country: string;
  /**
   * Approximate domestic equity market cap in USD trillions (rounded, from WFE May 2026).
   * null means the figure is not available in the dataset.
   */
  marketCapTrn: number | null;
  /**
   * WFE / global rank by domestic equity market cap.
   * null means the exchange is not in the WFE top-30 ranking.
   */
  rank: number | null;
  /** Number of listed companies (approximate) */
  listedCompanies: number;
  segments: MarketSegment[];
  practicalNote: string;
  /** Key index families associated with this venue */
  indices: string[];
  /** Source IDs from the source register */
  sourceIds: string[];
}

// ---------------------------------------------------------------------------
// Market segment definitions used inline across exchanges
// ---------------------------------------------------------------------------

const UK_SEGMENTS: MarketSegment[] = [
  {
    name: 'LSE Main Market',
    tier: 'main',
    description: 'UK regulated market for larger companies and funds.',
    notes:
      'Post-2024 categories include Equity Shares – Commercial Companies, closed-ended investment funds, international secondary listings, shell companies/SPACs and other retained categories.',
  },
  {
    name: 'AIM',
    tier: 'growth',
    description: "LSE's growth market for emerging/smaller companies.",
    notes:
      'Companies are not admitted to the FCA Official List. A nominated adviser (Nomad) is central to admission and ongoing compliance. Higher risk and usually less liquidity than the Main Market.',
  },
  {
    name: 'AQSE Growth Market – Apex',
    tier: 'growth',
    description: 'Growth market segment for larger/more established growth companies.',
    notes: 'Higher governance/visibility expectations than Access.',
  },
  {
    name: 'AQSE Growth Market – Access',
    tier: 'growth',
    description: 'Earlier-stage growth market segment.',
    notes:
      'A practical below-AIM route for very small public companies; liquidity can be thin.',
  },
  {
    name: 'AQSE Main Market',
    tier: 'main',
    description: 'UK regulated market operated by Aquis Stock Exchange.',
    notes: 'A smaller alternative to LSE for Official List securities.',
  },
];

const US_NYSE_SEGMENTS: MarketSegment[] = [
  {
    name: 'NYSE',
    tier: 'main',
    description: 'Main US exchange listing venue.',
    notes: 'Large-cap and international issuers; higher listing standards and heavy institutional visibility.',
  },
  {
    name: 'NYSE American',
    tier: 'growth',
    description: 'NYSE market for smaller and mid-sized issuers.',
    notes: 'Often viewed as a step below NYSE main listings but still exchange-listed.',
  },
  {
    name: 'NYSE Arca',
    tier: 'main',
    description: 'Exchange venue mainly used for exchange-traded products.',
    notes: 'Important for ETFs, ETPs and structured listed products.',
  },
];

const US_NASDAQ_SEGMENTS: MarketSegment[] = [
  {
    name: 'Nasdaq Global Select Market',
    tier: 'main',
    description: "Nasdaq's highest listing tier.",
    notes: 'Most stringent Nasdaq tier by financial and liquidity standards.',
  },
  {
    name: 'Nasdaq Global Market',
    tier: 'main',
    description: 'Mid-tier Nasdaq listing market.',
    notes: 'Still a national exchange listing, below Global Select.',
  },
  {
    name: 'Nasdaq Capital Market',
    tier: 'growth',
    description: 'Nasdaq listing tier for smaller capitalisation companies.',
    notes:
      "Often used by smaller growth companies that meet Nasdaq's public float, price and governance standards.",
  },
];

const US_OTC_SEGMENTS: MarketSegment[] = [
  {
    name: 'OTCQX',
    tier: 'otc',
    description: 'Top OTC Markets tier.',
    notes: 'Not a national exchange listing. Usually stronger disclosure/standards than lower OTC tiers.',
  },
  {
    name: 'OTCQB',
    tier: 'otc',
    description: 'Venture-stage OTC tier.',
    notes: 'Used by smaller and developing companies; lower liquidity and higher risk than exchange-listed equities.',
  },
  {
    name: 'OTCID',
    tier: 'otc',
    description: 'Basic disclosure tier introduced by OTC Markets.',
    notes: 'Replaced the old Pink Current concept as a baseline disclosure market from July 2025.',
  },
  {
    name: 'Pink Limited',
    tier: 'otc',
    description: 'Lower-transparency OTC tier.',
    notes: 'Illiquid and disclosure can be limited or unavailable. High risk.',
  },
  {
    name: 'Expert Market',
    tier: 'otc',
    description: 'Restricted OTC quotation tier for sophisticated investors.',
    notes: 'Very limited retail access; high risk.',
  },
  {
    name: 'Grey Market',
    tier: 'otc',
    description: 'No active market maker; unsolicited quotes only.',
    notes: 'Riskiest area of the OTC stack; essentially no price transparency.',
  },
];

// ---------------------------------------------------------------------------
// Exchange database
// ---------------------------------------------------------------------------

export const EXCHANGES: ExchangeInfo[] = [
  // ── United States ──────────────────────────────────────────────────────────
  {
    codes: ['NMS', 'NGM', 'NCM', 'XNAS', 'NASDAQ', 'NAS', 'NASDAQGS', 'NASDAQGM', 'NASDAQCM'],
    name: 'Nasdaq',
    region: 'United States',
    country: 'United States',
    marketCapTrn: 35.0,
    rank: 1,
    listedCompanies: 3366,
    segments: US_NASDAQ_SEGMENTS,
    practicalNote:
      'Tech-heavy US listing venue; also major ETF and index franchise. Three tiers: Global Select (most stringent), Global Market (mid-tier) and Capital Market (growth companies).',
    indices: ['Nasdaq Composite', 'Nasdaq-100', 'Nasdaq-100 Equal Weight'],
    sourceIds: ['S11'],
  },
  {
    codes: ['NYQ', 'NYS', 'XNYS', 'NYSE', 'ASE', 'PCX'],
    name: 'New York Stock Exchange',
    region: 'United States',
    country: 'United States',
    marketCapTrn: 30.96,
    rank: 2,
    listedCompanies: 2126,
    segments: US_NYSE_SEGMENTS,
    practicalNote:
      'Large-cap global issuers and traditional blue-chip venue. NYSE American serves smaller issuers; NYSE Arca is the primary ETF listing platform.',
    indices: ['S&P 500', 'S&P 400', 'S&P 600', 'DJIA', 'Russell 1000', 'Russell 2000'],
    sourceIds: ['S10'],
  },
  {
    codes: ['OTC', 'OTCM', 'PINK', 'OTCQX', 'OTCQB', 'OTCID'],
    name: 'OTC Markets',
    region: 'United States',
    country: 'United States',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 10000,
    segments: US_OTC_SEGMENTS,
    practicalNote:
      'OTC is NOT the same as being listed on NYSE/Nasdaq. Tiers from highest to lowest quality: OTCQX → OTCQB → OTCID → Pink Limited → Expert Market → Grey Market. Lower tiers can be extremely high-risk and illiquid.',
    indices: [],
    sourceIds: ['S12'],
  },
  // ── United Kingdom ────────────────────────────────────────────────────────
  {
    codes: ['LSE', 'AIM', 'XLON'],
    name: 'London Stock Exchange',
    region: 'United Kingdom',
    country: 'United Kingdom',
    marketCapTrn: 4.34,
    rank: 9,
    listedCompanies: 1991,
    segments: UK_SEGMENTS,
    practicalNote:
      'Mapped as: LSE Main Market → AIM → AQSE Growth Market. The Main Market is a UK Regulated Market; AIM is an MTF (Multilateral Trading Facility). FCA listing reform 2024 introduced new share categories on the Main Market.',
    indices: [
      'FTSE 100',
      'FTSE 250',
      'FTSE 350',
      'FTSE All-Share',
      'FTSE SmallCap',
      'FTSE Fledgling',
      'FTSE AIM UK 50',
      'FTSE AIM 100',
      'FTSE AIM All-Share',
    ],
    sourceIds: ['S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'],
  },
  // ── China ─────────────────────────────────────────────────────────────────
  {
    codes: ['SHA', 'XSHG', 'SSE'],
    name: 'Shanghai Stock Exchange',
    region: 'China',
    country: 'China',
    marketCapTrn: 10.19,
    rank: 3,
    listedCompanies: 2308,
    segments: [
      {
        name: 'Main Board',
        tier: 'main',
        description: 'Shanghai main A-share board.',
        notes: 'Large state-owned enterprises and leading private firms. Foreign investor access via Stock Connect.',
      },
      {
        name: 'STAR Market',
        tier: 'growth',
        description: 'Technology and science innovation board.',
        notes: 'Launched 2019 for hard-tech companies. Uses a registration-based IPO system. Science and Technology Innovation Board (科创板).',
      },
    ],
    practicalNote:
      'Large China A-share venue; STAR is the technology/science board. Foreign investor routes differ from western markets.',
    indices: ['SSE Composite', 'SSE 50', 'CSI 300', 'STAR 50'],
    sourceIds: [],
  },
  {
    codes: ['SHZ', 'XSHE', 'SZSE'],
    name: 'Shenzhen Stock Exchange',
    region: 'China',
    country: 'China',
    marketCapTrn: 6.36,
    rank: 6,
    listedCompanies: 2889,
    segments: [
      {
        name: 'Main Board',
        tier: 'main',
        description: 'Shenzhen main A-share board.',
        notes: 'Established companies across multiple sectors. Merged with former SME Board in 2021.',
      },
      {
        name: 'ChiNext',
        tier: 'growth',
        description: "China's innovation/growth exchange board.",
        notes: 'High-growth and innovative companies. Registration-based IPO system since 2020.',
      },
    ],
    practicalNote: "China's innovation/growth-heavy exchange. ChiNext is the primary growth board.",
    indices: ['SZSE Component', 'ChiNext Index', 'CSI 300'],
    sourceIds: [],
  },
  // ── Pan-Europe ────────────────────────────────────────────────────────────
  {
    codes: ['EPA', 'EBR', 'AMS', 'MIL', 'OSL', 'EURONEXT', 'XPAR', 'XAMS', 'XBRU', 'XMIL', 'XOSL'],
    name: 'Euronext',
    region: 'Pan-Europe',
    country: 'Netherlands / France / Belgium / Italy / Norway / Portugal / Ireland / Greece',
    marketCapTrn: 8.68,
    rank: 4,
    listedCompanies: 1753,
    segments: [
      {
        name: 'Regulated Markets',
        tier: 'main',
        description: 'National regulated markets in each Euronext country.',
        notes: 'Covers Amsterdam, Paris, Milan, Oslo, Brussels, Dublin, Lisbon and Athens.',
      },
      {
        name: 'Euronext Growth',
        tier: 'growth',
        description: 'SME/growth market; lighter entry conditions than the regulated market.',
        notes:
          'Operates as an MTF. Lower cost public route for smaller companies; lighter disclosure and listing requirements.',
      },
      {
        name: 'Euronext Access',
        tier: 'sme',
        description: 'Entry-level SME market for very early stage issuers.',
        notes: 'Lowest barrier to entry in the Euronext ecosystem; limited liquidity expected.',
      },
    ],
    practicalNote:
      'Covers Amsterdam, Paris, Milan, Oslo, Brussels, Dublin, Lisbon and Athens. Growth and Access are SME/growth markets with lighter entry conditions than the regulated market.',
    indices: ['CAC 40', 'CAC Next 20', 'AEX', 'BEL 20', 'PSI 20', 'MIB', 'OBX'],
    sourceIds: ['S13'],
  },
  // ── Japan ─────────────────────────────────────────────────────────────────
  {
    codes: ['TYO', 'TSE', 'XTKS', 'JPX', 'OSE'],
    name: 'Japan Exchange Group',
    region: 'Japan',
    country: 'Japan',
    marketCapTrn: 7.64,
    rank: 5,
    listedCompanies: 3922,
    segments: [
      {
        name: 'TSE Prime',
        tier: 'main',
        description: 'Senior market for top-tier companies.',
        notes: 'Highest standards of governance, financial strength and liquidity. Eligible for global index inclusion.',
      },
      {
        name: 'TSE Standard',
        tier: 'main',
        description: 'Public market for established businesses.',
        notes: 'Companies meeting standard governance and disclosure requirements.',
      },
      {
        name: 'TSE Growth',
        tier: 'growth',
        description: 'Market for higher-growth companies.',
        notes: 'Lighter entry criteria; companies expected to grow toward Prime or Standard.',
      },
      {
        name: 'TOKYO PRO Market',
        tier: 'professional',
        description: 'Professional investor–only market.',
        notes: 'Listing via J-Adviser system; retail investor access restricted.',
      },
    ],
    practicalNote:
      'TSE market structure reformed into Prime, Standard and Growth in 2022. Prime is the senior market; TOKYO PRO is professional-investor oriented.',
    indices: ['Nikkei 225', 'TOPIX', 'TOPIX 500', 'JPX-Nikkei 400'],
    sourceIds: ['S15'],
  },
  // ── Hong Kong ─────────────────────────────────────────────────────────────
  {
    codes: ['HKG', 'XHKG', 'HKEX'],
    name: 'Hong Kong Exchanges & Clearing',
    region: 'Hong Kong / China',
    country: 'Hong Kong',
    marketCapTrn: 5.86,
    rank: 7,
    listedCompanies: 2707,
    segments: [
      {
        name: 'Main Board',
        tier: 'main',
        description: 'For companies meeting stronger financial tests.',
        notes: 'Key international gateway for China-related listings. Dual listings common with Shanghai/Shenzhen via Stock Connect.',
      },
      {
        name: 'GEM',
        tier: 'growth',
        description: 'Growth Enterprise Market for smaller and mid-sized growth issuers.',
        notes: 'Lighter entry criteria than Main Board; higher risk and lower liquidity typical.',
      },
    ],
    practicalNote:
      'Key international gateway for China-related listings. Main Board for companies meeting stronger financial tests; GEM serves smaller and mid-sized growth issuers.',
    indices: ['Hang Seng Index', 'Hang Seng Tech', 'HSCEI'],
    sourceIds: ['S16'],
  },
  // ── Canada ────────────────────────────────────────────────────────────────
  {
    codes: ['TSX', 'XTSE', 'CVE', 'TRT', 'TSXV', 'TOR'],
    name: 'TMX Group',
    region: 'North America',
    country: 'Canada',
    marketCapTrn: 4.71,
    rank: 8,
    listedCompanies: 3752,
    segments: [
      {
        name: 'TSX',
        tier: 'main',
        description: 'Toronto Stock Exchange — senior market.',
        notes: 'Large resources, financials and growth-company ecosystem. S&P/TSX Composite tracks this market.',
      },
      {
        name: 'TSX Venture Exchange',
        tier: 'growth',
        description: 'Growth, venture and resource-focused exchange.',
        notes: 'Important for exploration-stage mining, oil & gas and early-stage technology companies.',
      },
      {
        name: 'CSE',
        tier: 'growth',
        description: 'Canadian Securities Exchange.',
        notes: 'Alternative listing venue for growth and cannabis companies; lower listing costs.',
      },
    ],
    practicalNote:
      'TSX is the senior market. TSX Venture, CSE and Cboe Canada are important for growth, venture, ETFs and alternative listings. Large resources, financials and growth-company ecosystem.',
    indices: ['S&P/TSX Composite', 'S&P/TSX 60', 'S&P/TSX SmallCap'],
    sourceIds: [],
  },
  // ── India ─────────────────────────────────────────────────────────────────
  {
    codes: ['NSE', 'XNSE', 'NSI'],
    name: 'National Stock Exchange of India',
    region: 'Asia',
    country: 'India',
    marketCapTrn: 4.34,
    rank: 10,
    listedCompanies: 2979,
    segments: [
      {
        name: 'NSE Main Board',
        tier: 'main',
        description: "India's leading exchange by cash equity liquidity.",
        notes: 'NIFTY 50 is the flagship index. Dominant in derivatives trading.',
      },
      {
        name: 'NSE Emerge',
        tier: 'sme',
        description: 'NSE SME platform.',
        notes: 'Can migrate to main board subject to eligibility criteria.',
      },
    ],
    practicalNote:
      "India's leading exchange by cash equity liquidity. NSE Emerge is the active SME platform with migration path to main board.",
    indices: ['NIFTY 50', 'NIFTY Next 50', 'NIFTY 500', 'NIFTY Midcap 100'],
    sourceIds: [],
  },
  {
    codes: ['BSE', 'XBOM', 'BOM'],
    name: 'BSE India',
    region: 'Asia',
    country: 'India',
    marketCapTrn: 4.33,
    rank: 11,
    listedCompanies: 5596,
    segments: [
      {
        name: 'BSE Main Board',
        tier: 'main',
        description: "Asia's oldest stock exchange (est. 1875).",
        notes: 'Large listed-company count. Major indices: SENSEX and BSE 100.',
      },
      {
        name: 'BSE SME',
        tier: 'sme',
        description: 'BSE SME platform for small and medium enterprises.',
        notes: 'Active SME platform with migration path to main board.',
      },
    ],
    practicalNote: 'Large listed-company count; major SME platform. SENSEX is the flagship 30-stock index.',
    indices: ['SENSEX', 'BSE 100', 'BSE 500', 'BSE MidCap', 'BSE SmallCap'],
    sourceIds: [],
  },
  // ── Taiwan ────────────────────────────────────────────────────────────────
  {
    codes: ['TWO', 'XTAI', 'TAI'],
    name: 'Taiwan Stock Exchange',
    region: 'Asia',
    country: 'Taiwan',
    marketCapTrn: 3.23,
    rank: 12,
    listedCompanies: 1080,
    segments: [
      {
        name: 'TWSE Listed Market',
        tier: 'main',
        description: 'Senior Taiwan listed market.',
        notes: 'Dominated by semiconductors (TSMC, MediaTek) and technology supply chain.',
      },
      {
        name: 'Taipei Exchange (TPEx)',
        tier: 'growth',
        description: 'OTC-style market for smaller companies.',
        notes: 'Provides a path between the Emerging Stock Board and full TWSE listing.',
      },
      {
        name: 'Emerging Stock Board',
        tier: 'sme',
        description: 'Pre-listing development board.',
        notes: 'Entry point before applying for TPEx or TWSE listing.',
      },
    ],
    practicalNote: 'Dominated by semiconductors and technology supply chain exposure. TAIEX is the main index.',
    indices: ['TAIEX'],
    sourceIds: [],
  },
  // ── South Korea ───────────────────────────────────────────────────────────
  {
    codes: ['KRX', 'KOE', 'KOS'],
    name: 'Korea Exchange',
    region: 'Asia',
    country: 'South Korea',
    marketCapTrn: 3.11,
    rank: 13,
    listedCompanies: 2661,
    segments: [
      {
        name: 'KOSPI',
        tier: 'main',
        description: 'Korea Composite Stock Price Index market — senior board.',
        notes: 'Main market for large-cap Korean companies. Samsung, Hyundai, SK Hynix listed here.',
      },
      {
        name: 'KOSDAQ',
        tier: 'growth',
        description: 'Growth/technology market.',
        notes: 'Focus on technology, biotech and growth companies; Korea equivalent of Nasdaq.',
      },
      {
        name: 'KONEX',
        tier: 'sme',
        description: 'SME/venture market.',
        notes: 'Supports smaller venture/SME companies; provides path to KOSPI or KOSDAQ.',
      },
    ],
    practicalNote: 'KOSPI for large caps; KOSDAQ/KONEX for growth/SMEs.',
    indices: ['KOSPI 200', 'KOSDAQ 150'],
    sourceIds: [],
  },
  // ── Germany ───────────────────────────────────────────────────────────────
  {
    codes: ['FRA', 'ETR', 'XFRA', 'XETRA'],
    name: 'Deutsche Börse',
    region: 'Europe',
    country: 'Germany',
    marketCapTrn: 2.66,
    rank: 14,
    listedCompanies: 422,
    segments: [
      {
        name: 'Prime Standard',
        tier: 'main',
        description: 'Highest-transparency listing segment.',
        notes: 'Required for inclusion in DAX-family indices. Targets international investors with strict additional reporting requirements.',
      },
      {
        name: 'General Standard',
        tier: 'main',
        description: 'Standard regulated market segment.',
        notes: 'Meets EU regulated market minimum requirements without Prime Standard extras.',
      },
      {
        name: 'Scale',
        tier: 'sme',
        description: 'SME growth segment.',
        notes: 'Exchange-regulated (not EU Regulated Market). Designed for SMEs seeking visibility with institutional investors.',
      },
    ],
    practicalNote:
      'Prime Standard is the gateway for DAX-family inclusion. Scale is the SME growth segment.',
    indices: ['DAX', 'MDAX', 'SDAX', 'TecDAX'],
    sourceIds: ['S14'],
  },
  // ── Saudi Arabia ──────────────────────────────────────────────────────────
  {
    codes: ['SAU', 'XSAU', 'TADAWUL'],
    name: 'Saudi Exchange (Tadawul)',
    region: 'Middle East',
    country: 'Saudi Arabia',
    marketCapTrn: 2.64,
    rank: 15,
    listedCompanies: 394,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Primary listing market for large Saudi and international companies.',
        notes: 'Aramco is by far the largest listed company globally by market cap. Substantial state-linked issuer base.',
      },
      {
        name: 'Nomu Parallel Market',
        tier: 'growth',
        description: 'Growth market with lighter entry criteria.',
        notes: 'Designed for smaller/growth issuers. Lighter admission requirements than the Main Market.',
      },
    ],
    practicalNote:
      'Largest Middle Eastern venue by WFE market cap. Aramco dominates by market cap.',
    indices: ['TASI (Tadawul All Share Index)', 'NOMU Index'],
    sourceIds: ['S18'],
  },
  // ── Switzerland ───────────────────────────────────────────────────────────
  {
    codes: ['SWX', 'XSWX', 'VTX'],
    name: 'SIX Swiss Exchange',
    region: 'Europe',
    country: 'Switzerland',
    marketCapTrn: 2.45,
    rank: 16,
    listedCompanies: 209,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Primary Swiss listing market.',
        notes: 'Large pharma (Novartis, Roche), financial and industrial issuer base.',
      },
      {
        name: 'Sparks',
        tier: 'sme',
        description: 'SME segment for smaller companies.',
        notes: 'Designed for smaller companies; market-cap ceiling defined in the official handbook.',
      },
    ],
    practicalNote: 'Large pharma, financial and industrial issuer base.',
    indices: ['SMI', 'SPI', 'SLI'],
    sourceIds: [],
  },
  // ── Australia ─────────────────────────────────────────────────────────────
  {
    codes: ['ASX', 'XASX'],
    name: 'ASX',
    region: 'Asia-Pacific',
    country: 'Australia',
    marketCapTrn: 2.25,
    rank: 17,
    listedCompanies: 1895,
    segments: [
      {
        name: 'ASX Listed Market',
        tier: 'main',
        description: 'Main Australian listing venue.',
        notes: 'Resources, banks and REITs matter heavily. S&P/ASX indices family used for fund benchmarking.',
      },
    ],
    practicalNote: 'Main Australian listing venue; resources and financials heavy.',
    indices: ['S&P/ASX 20', 'S&P/ASX 50', 'S&P/ASX 100', 'S&P/ASX 200', 'S&P/ASX 300'],
    sourceIds: [],
  },
  // ── Nordics / Baltics ─────────────────────────────────────────────────────
  {
    codes: ['STO', 'OMX', 'HEL', 'CPH', 'XSTO', 'XCSE', 'XHEL', 'XICE', 'XRIS', 'XTAL', 'XLIT'],
    name: 'Nasdaq Nordic & Baltics',
    region: 'Nordics / Baltics',
    country: 'Sweden / Denmark / Finland / Iceland / Latvia / Estonia / Lithuania',
    marketCapTrn: 2.21,
    rank: 18,
    listedCompanies: 1112,
    segments: [
      {
        name: 'Main Markets',
        tier: 'main',
        description: 'Main regulated markets across Nordic and Baltic venues.',
        notes: 'Stockholm, Copenhagen, Helsinki, Iceland and Baltic venues.',
      },
      {
        name: 'First North Premier Growth Market',
        tier: 'growth',
        description: 'Higher-standard growth market tier.',
        notes: 'Leads to potential Main Market transfer.',
      },
      {
        name: 'First North Growth Market',
        tier: 'growth',
        description: 'Growth market path for smaller companies.',
        notes: 'Lighter entry and ongoing obligations; higher perceived risk.',
      },
    ],
    practicalNote:
      'Covers Stockholm, Copenhagen, Helsinki, Iceland and Baltic venues. First North is the primary growth market path.',
    indices: ['OMX Stockholm 30 (OMXS30)', 'OMX Copenhagen 25', 'OMX Helsinki 25'],
    sourceIds: [],
  },
  // ── Spain ─────────────────────────────────────────────────────────────────
  {
    codes: ['MCE', 'XMAD', 'BME'],
    name: 'BME Spanish Exchanges',
    region: 'Europe',
    country: 'Spain',
    marketCapTrn: 1.43,
    rank: 19,
    listedCompanies: 295,
    segments: [
      {
        name: 'Main Market (Bolsa)',
        tier: 'main',
        description: 'Primary Spanish regulated market.',
        notes: 'IBEX 35 tracks the 35 most liquid Main Market companies.',
      },
      {
        name: 'BME Growth',
        tier: 'sme',
        description: 'SME/growth market.',
        notes: 'Part of SIX Group; lighter admission requirements; designed for SMEs.',
      },
      {
        name: 'BME Scaleup',
        tier: 'sme',
        description: 'Targets high-growth companies earlier in the funding path.',
        notes: 'Pre-growth market route for companies not yet meeting BME Growth criteria.',
      },
    ],
    practicalNote: 'Part of SIX Group. BME Growth is the SME market; BME Scaleup targets high-growth companies earlier in the funding path.',
    indices: ['IBEX 35'],
    sourceIds: ['S20'],
  },
  // ── South Africa ──────────────────────────────────────────────────────────
  {
    codes: ['JSE', 'XJSE'],
    name: 'Johannesburg Stock Exchange',
    region: 'Africa',
    country: 'South Africa',
    marketCapTrn: 1.38,
    rank: 20,
    listedCompanies: 263,
    segments: [
      {
        name: 'Main Board',
        tier: 'main',
        description: "Africa's largest public equity market.",
        notes: 'Resources, financials and industrials dominate. Rand-denominated but globally connected.',
      },
      {
        name: 'AltX',
        tier: 'growth',
        description: 'Alternative Exchange for smaller high-growth companies.',
        notes: "JSE's parallel growth market; similar concept to AIM or Nasdaq Capital Market.",
      },
    ],
    practicalNote: "Africa's largest public equity market. AltX is the JSE's parallel growth market.",
    indices: ['FTSE/JSE Top 40', 'FTSE/JSE All Share', 'FTSE/JSE Mid Cap'],
    sourceIds: ['S19'],
  },
  // ── Brazil ────────────────────────────────────────────────────────────────
  {
    codes: ['SAO', 'BVSP', 'B3', 'XBSP'],
    name: 'B3',
    region: 'Latin America',
    country: 'Brazil',
    marketCapTrn: 1.04,
    rank: 21,
    listedCompanies: 352,
    segments: [
      {
        name: 'Novo Mercado',
        tier: 'main',
        description: 'Highest governance listing segment.',
        notes: 'Requires 100% free-float, one share one vote, and extended governance commitments.',
      },
      {
        name: 'Nível 2 / Nível 1',
        tier: 'main',
        description: 'Graduated governance segments below Novo Mercado.',
        notes: 'Intermediate governance requirements.',
      },
      {
        name: 'Bovespa Mais',
        tier: 'growth',
        description: 'SME growth market.',
        notes: 'Designed for smaller companies seeking public market access.',
      },
    ],
    practicalNote: "Latin America's largest listed-equity venue. Novo Mercado is the premium governance segment.",
    indices: ['IBOVESPA', 'IBRX 50', 'IBRX 100'],
    sourceIds: [],
  },
  // ── Singapore ─────────────────────────────────────────────────────────────
  {
    codes: ['SGX', 'XSES'],
    name: 'Singapore Exchange',
    region: 'Asia',
    country: 'Singapore',
    marketCapTrn: 0.85,
    rank: 22,
    listedCompanies: 604,
    segments: [
      {
        name: 'Mainboard',
        tier: 'main',
        description: 'SGX primary listed market.',
        notes: 'Regional gateway; higher financial and governance standards.',
      },
      {
        name: 'Catalist',
        tier: 'growth',
        description: 'Sponsor-supervised growth market.',
        notes: 'Aimed at dynamic growth companies; sponsor (Continuing Sponsor) takes regulatory responsibility.',
      },
    ],
    practicalNote: 'Regional gateway; Mainboard plus sponsor-supervised Catalist.',
    indices: ['STI (Straits Times Index)', 'FTSE ST All-Share'],
    sourceIds: ['S17'],
  },
  // ── UAE ───────────────────────────────────────────────────────────────────
  {
    codes: ['ADX', 'XADS'],
    name: 'Abu Dhabi Securities Exchange',
    region: 'Middle East',
    country: 'UAE',
    marketCapTrn: 0.75,
    rank: 23,
    listedCompanies: 104,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Primary ADX listing market.',
        notes: 'Large GCC venue with state-linked and private-sector issuers. ADNOC group companies listed here.',
      },
      {
        name: 'ADX Growth Market',
        tier: 'growth',
        description: 'Growth market for private joint stock companies.',
        notes: 'Listing by private placement or direct listing.',
      },
    ],
    practicalNote: 'Large GCC venue with state-linked and private-sector issuers.',
    indices: ['ADX General Index', 'FTSE ADX 15'],
    sourceIds: ['S24'],
  },
  {
    codes: ['DFM', 'XDFM'],
    name: 'Dubai Financial Market',
    region: 'Middle East',
    country: 'UAE',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 100,
    segments: [
      {
        name: 'DFM Main Market',
        tier: 'main',
        description: 'Domestic Dubai market.',
        notes: 'Real estate, banking and telecom heavy.',
      },
      {
        name: 'Nasdaq Dubai',
        tier: 'main',
        description: 'International DIFC exchange for regional/international issuers.',
        notes: 'USD-denominated; DIFC regulatory framework; separate from DFM proper.',
      },
    ],
    practicalNote: 'DFM is domestic Dubai market; Nasdaq Dubai is the international DIFC exchange.',
    indices: ['DFMGI'],
    sourceIds: [],
  },
  // ── Indonesia ─────────────────────────────────────────────────────────────
  {
    codes: ['IDX', 'XIDX', 'JKT'],
    name: 'Indonesia Stock Exchange',
    region: 'Asia',
    country: 'Indonesia',
    marketCapTrn: 0.73,
    rank: 24,
    listedCompanies: 956,
    segments: [
      {
        name: 'Main Board',
        tier: 'main',
        description: 'IDX main listing board.',
        notes: 'Large capitalisation, established Indonesian companies.',
      },
      {
        name: 'Main Board – New Economy',
        tier: 'main',
        description: 'Main Board segment for tech/new economy companies.',
        notes: 'Allows pre-profit technology companies with modified financial criteria.',
      },
      {
        name: 'Development Board',
        tier: 'growth',
        description: 'Developing companies board.',
        notes: 'Companies with lower financial metrics than Main Board requirements.',
      },
      {
        name: 'Acceleration Board',
        tier: 'sme',
        description: 'SME/lower-requirement route.',
        notes: 'Fastest route to public market for very small companies.',
      },
    ],
    practicalNote: 'Large ASEAN venue with multiple listing boards.',
    indices: ['IDX Composite (IHSG)', 'LQ45', 'IDX30'],
    sourceIds: ['S22'],
  },
  // ── Thailand ──────────────────────────────────────────────────────────────
  {
    codes: ['SET', 'XBKK'],
    name: 'Stock Exchange of Thailand',
    region: 'Asia',
    country: 'Thailand',
    marketCapTrn: 0.56,
    rank: 26,
    listedCompanies: 868,
    segments: [
      {
        name: 'SET',
        tier: 'main',
        description: 'Stock Exchange of Thailand main board.',
        notes: 'Banks, energy companies and conglomerates dominate.',
      },
      {
        name: 'mai',
        tier: 'growth',
        description: 'Market for Alternative Investment.',
        notes: 'Focus on smaller/growth companies.',
      },
    ],
    practicalNote: 'SET is the main exchange; mai is the Market for Alternative Investment for smaller/growth companies.',
    indices: ['SET Index', 'SET50', 'SET100'],
    sourceIds: [],
  },
  // ── Malaysia ──────────────────────────────────────────────────────────────
  {
    codes: ['MYX', 'XKLS', 'BURSA'],
    name: 'Bursa Malaysia',
    region: 'Asia',
    country: 'Malaysia',
    marketCapTrn: 0.49,
    rank: 27,
    listedCompanies: 1089,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Bursa primary listed market.',
        notes: 'KLCI tracks 30 largest Main Market companies.',
      },
      {
        name: 'ACE Market',
        tier: 'growth',
        description: 'Sponsor-driven growth market.',
        notes: 'ACE is growth-company focused; similar to AIM or Catalist.',
      },
      {
        name: 'LEAP Market',
        tier: 'sme',
        description: 'Adviser-driven SME market.',
        notes: 'Targets emerging SMEs; not open to retail investors.',
      },
    ],
    practicalNote: 'ACE is growth-company focused; LEAP targets emerging SMEs.',
    indices: ['FBMKLCI', 'FBM70', 'FBM Small Cap'],
    sourceIds: ['S21'],
  },
  // ── Turkey ────────────────────────────────────────────────────────────────
  {
    codes: ['BIST', 'XIST'],
    name: 'Borsa Istanbul',
    region: 'Europe / Emerging Markets',
    country: 'Turkey',
    marketCapTrn: 0.44,
    rank: 28,
    listedCompanies: 583,
    segments: [
      {
        name: 'Stars Market',
        tier: 'main',
        description: 'Top-tier Turkish market.',
        notes: 'Most liquid and well-known Turkish equities.',
      },
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Standard regulated market.',
        notes: 'Established Turkish companies.',
      },
      {
        name: 'SubMarket',
        tier: 'growth',
        description: 'Sub-market for smaller companies.',
        notes: 'Lower market-cap companies and special situations.',
      },
    ],
    practicalNote: 'Important regional emerging-market venue.',
    indices: ['BIST 100', 'BIST 30'],
    sourceIds: [],
  },
  // ── Poland ────────────────────────────────────────────────────────────────
  {
    codes: ['WSE', 'XWAR'],
    name: 'Warsaw Stock Exchange',
    region: 'Europe',
    country: 'Poland',
    marketCapTrn: 0.32,
    rank: 29,
    listedCompanies: 755,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'WSE regulated market.',
        notes: 'Central/Eastern Europe hub; home to major Polish banks, energy and industrial companies.',
      },
      {
        name: 'NewConnect',
        tier: 'growth',
        description: 'Alternative market for smaller/start-up issuers.',
        notes: 'MTF; lighter rules; higher risk.',
      },
    ],
    practicalNote: 'Central/Eastern Europe hub; NewConnect is the alternative market.',
    indices: ['WIG20', 'WIG40', 'WIG80', 'WIG'],
    sourceIds: [],
  },
  // ── Vietnam ───────────────────────────────────────────────────────────────
  {
    codes: ['HOSE', 'XSTC'],
    name: 'Ho Chi Minh Stock Exchange',
    region: 'Asia',
    country: 'Vietnam',
    marketCapTrn: 0.30,
    rank: 30,
    listedCompanies: 403,
    segments: [
      {
        name: 'HOSE Main Board',
        tier: 'main',
        description: "Vietnam's main large-cap exchange.",
        notes: 'VN-Index tracks all HOSE listed companies.',
      },
      {
        name: 'UPCoM',
        tier: 'growth',
        description: 'Unlisted Public Company Market.',
        notes: 'OTC market for public companies not yet listed on a formal exchange.',
      },
      {
        name: 'HNX',
        tier: 'growth',
        description: 'Hanoi Stock Exchange.',
        notes: 'Northern exchange; smaller-cap focus.',
      },
    ],
    practicalNote: "Vietnam's main large-cap exchange.",
    indices: ['VN-Index', 'VN30'],
    sourceIds: [],
  },
  // ── Qatar ─────────────────────────────────────────────────────────────────
  {
    codes: ['QSE', 'XQAT', 'DOH'],
    name: 'Qatar Stock Exchange',
    region: 'Middle East',
    country: 'Qatar',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 50,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'QSE primary market.',
        notes: 'Oil-and-gas and banking dominated.',
      },
      {
        name: 'QE Venture Market',
        tier: 'growth',
        description: 'SME/growth route with a more flexible regulatory regime.',
        notes: 'Designed for Qatari growth companies.',
      },
    ],
    practicalNote: 'Venture Market is the SME/growth route.',
    indices: ['QSI (Qatar Stock Index)'],
    sourceIds: ['S23'],
  },
  // ── Kuwait ────────────────────────────────────────────────────────────────
  {
    codes: ['KSE', 'XKUW', 'BOURSA'],
    name: 'Boursa Kuwait',
    region: 'Middle East',
    country: 'Kuwait',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 170,
    segments: [
      {
        name: 'Premier Market',
        tier: 'main',
        description: 'Flagship liquidity market.',
        notes: 'Largest and most liquid Kuwaiti companies.',
      },
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Standard market for established companies.',
        notes: '',
      },
      {
        name: 'Auction Market',
        tier: 'growth',
        description: 'Auction-based lower-tier market.',
        notes: '',
      },
      {
        name: 'Emerging Companies Market',
        tier: 'sme',
        description: 'Emerging companies market.',
        notes: 'Entry-level route for smaller/newer companies.',
      },
    ],
    practicalNote: 'Premier is the flagship/liquidity market; lower segments target different liquidity and issuer profiles.',
    indices: ['All Share Index', 'Premier Market Index'],
    sourceIds: ['S25'],
  },
  // ── Israel ────────────────────────────────────────────────────────────────
  {
    codes: ['TASE', 'XTAE', 'TLV'],
    name: 'Tel Aviv Stock Exchange',
    region: 'Middle East',
    country: 'Israel',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 440,
    segments: [
      {
        name: 'TASE Main Market',
        tier: 'main',
        description: 'Core Israeli public equity venue.',
        notes: 'Technology, pharma and defence companies are prominent.',
      },
    ],
    practicalNote: 'TASE is the core Israeli public equity venue.',
    indices: ['TA-35', 'TA-90', 'TA-125', 'TA-SME60'],
    sourceIds: [],
  },
  // ── Austria ───────────────────────────────────────────────────────────────
  {
    codes: ['WBO', 'XWBO', 'VIE'],
    name: 'Vienna Stock Exchange',
    region: 'Europe',
    country: 'Austria',
    marketCapTrn: null,
    rank: null,
    listedCompanies: 60,
    segments: [
      {
        name: 'Official Market',
        tier: 'main',
        description: 'Vienna regulated market.',
        notes: 'Austrian blue-chips; also popular for Central/Eastern European companies.',
      },
      {
        name: 'direct market plus',
        tier: 'sme',
        description: 'Exchange-regulated entry segment for SMEs and young expanding companies.',
        notes: 'Lower barrier to entry; not a Regulated Market.',
      },
    ],
    practicalNote: 'direct market plus is an exchange-regulated entry segment for SMEs and young expanding companies.',
    indices: ['ATX', 'ATX Prime'],
    sourceIds: [],
  },
  // ── Mexico ────────────────────────────────────────────────────────────────
  {
    codes: ['MEX', 'XMEX', 'BMV'],
    name: 'Bolsa Mexicana de Valores',
    region: 'Latin America',
    country: 'Mexico',
    marketCapTrn: 0.59,
    rank: 25,
    listedCompanies: 130,
    segments: [
      {
        name: 'Main Market',
        tier: 'main',
        description: 'Mexican primary equity market.',
        notes: "Mexico's historic exchange group; BIVA is an alternative trading venue.",
      },
    ],
    practicalNote: "Mexico's historic exchange group.",
    indices: ['IPC (Indice de Precios y Cotizaciones)', 'IPC CompMx'],
    sourceIds: [],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

// Market-cap size thresholds (USD).
// Large-cap >= $10 B, mid-cap $2 B–$10 B, small-cap < $2 B —
// aligned with commonly used institutional classification boundaries.
export const LARGE_CAP_THRESHOLD = 10_000_000_000; // $10 B
export const MID_CAP_THRESHOLD = 2_000_000_000;    // $2 B

/**
 * Precomputed Map from upper-cased exchange code → ExchangeInfo.
 * Built once at module load for O(1) lookups in `lookupExchange`.
 * Yahoo Finance returns codes such as 'NMS', 'NGM', 'NCM' for Nasdaq tiers and
 * 'NasdaqGS', 'NasdaqGM', 'NasdaqCM' in fullExchangeName. Both forms are
 * included in the EXCHANGES codes arrays so every variant maps correctly.
 */
const EXCHANGE_CODE_MAP: Map<string, ExchangeInfo> = (() => {
  const map = new Map<string, ExchangeInfo>();
  for (const ex of EXCHANGES) {
    for (const code of ex.codes) {
      map.set(code.toUpperCase(), ex);
    }
  }
  return map;
})();

const EXCHANGE_NAME_MAP: Map<string, ExchangeInfo> = (() => {
  const map = new Map<string, ExchangeInfo>();
  for (const ex of EXCHANGES) {
    map.set(ex.name.toUpperCase(), ex);
  }
  return map;
})();

const YAHOO_EXCHANGE_ALIASES: Record<string, string> = {
  // Full exchange names / common Yahoo variants → canonical codes used in EXCHANGES.
  'NEW YORK STOCK EXCHANGE': 'NYSE',
  NYSEARCA: 'PCX',
  'NYSE ARCA': 'PCX',
  NYSEAMERICAN: 'ASE',
  'NYSE AMERICAN': 'ASE',
  NYSEAMEX: 'ASE',
  'NYSE AMEX': 'ASE',
  'TORONTO STOCK EXCHANGE': 'TOR',
  TORONTO: 'TOR',
};

function normalizeExchangeLookupKey(exchange: string, ticker?: string): string {
  let upper = exchange.toUpperCase().trim();
  if (!upper) return '';

  const alias = YAHOO_EXCHANGE_ALIASES[upper];
  if (alias) upper = alias;

  // Yahoo has been observed to return `TSE` for Toronto listings in some contexts.
  // Disambiguate with the conventional `.TO` suffix when available.
  if (upper === 'TSE' && ticker && ticker.toUpperCase().trim().endsWith('.TO')) {
    upper = 'TOR';
  }

  return upper;
}

/**
 * Look up an ExchangeInfo record by Yahoo Finance exchange code or common code.
 * The lookup is case-insensitive. Returns the first matching exchange, or
 * undefined if no match is found.
 */
export function lookupExchange(exchange: string, options?: { ticker?: string }): ExchangeInfo | undefined {
  if (!exchange) return undefined;
  const upper = normalizeExchangeLookupKey(exchange, options?.ticker);
  if (!upper) return undefined;
  return EXCHANGE_CODE_MAP.get(upper) ?? EXCHANGE_NAME_MAP.get(upper);
}

function resolveNyseTierFromCode(
  exchangeCodeUpper: string,
): { segmentName: 'NYSE' | 'NYSE American' | 'NYSE Arca'; tierLabel: 'NYSE Main' | 'NYSE American' | 'NYSE Arca' } | null {
  if (['ASE'].includes(exchangeCodeUpper)) return { segmentName: 'NYSE American', tierLabel: 'NYSE American' };
  if (['PCX'].includes(exchangeCodeUpper)) return { segmentName: 'NYSE Arca', tierLabel: 'NYSE Arca' };
  if (['NYQ', 'NYS', 'XNYS', 'NYSE'].includes(exchangeCodeUpper))
    return { segmentName: 'NYSE', tierLabel: 'NYSE Main' };
  return null;
}

function resolveListingMetadata(
  ex: ExchangeInfo,
  exchangeCodeUpper: string,
): {
  likelySegment: MarketSegment | undefined;
  tierLabel: string;
  exchangeNameOverride?: string;
  rankOverride: number | null;
  marketCapTrnOverride: number | null;
} {
  let likelySegment = ex.segments.find((s) => s.tier === 'main') ?? ex.segments[0];
  let tierLabel = likelySegment?.name ?? 'Listed';
  let exchangeNameOverride: string | undefined;
  let rankOverride: number | null = ex.rank;
  let marketCapTrnOverride: number | null = ex.marketCapTrn;

  if (ex.name === 'Nasdaq') {
    if (['NMS', 'XNAS', 'NASDAQGS'].includes(exchangeCodeUpper)) {
      likelySegment = ex.segments.find((s) => s.name === 'Nasdaq Global Select Market') ?? likelySegment;
    } else if (['NGM', 'NASDAQGM'].includes(exchangeCodeUpper)) {
      likelySegment = ex.segments.find((s) => s.name === 'Nasdaq Global Market') ?? likelySegment;
    } else if (['NCM', 'NASDAQCM'].includes(exchangeCodeUpper)) {
      likelySegment = ex.segments.find((s) => s.name === 'Nasdaq Capital Market') ?? likelySegment;
    }
    tierLabel = likelySegment?.name ?? tierLabel;
  } else if (ex.name === 'New York Stock Exchange') {
    const nyseTier = resolveNyseTierFromCode(exchangeCodeUpper);
    if (nyseTier) {
      likelySegment = ex.segments.find((s) => s.name === nyseTier.segmentName) ?? likelySegment;
      tierLabel = nyseTier.tierLabel;

      // NYSE American and NYSE Arca are distinct venues; reuse the NYSE record for
      // segment intelligence, but avoid presenting NYSE-main rank/market-cap as if
      // it applied directly to those venues.
      if (nyseTier.segmentName !== 'NYSE') {
        exchangeNameOverride = nyseTier.segmentName;
        rankOverride = null;
        marketCapTrnOverride = null;
      }
    }
  } else if (ex.name === 'London Stock Exchange') {
    if (exchangeCodeUpper === 'AIM') {
      likelySegment = ex.segments.find((s) => s.name === 'AIM') ?? likelySegment;
      tierLabel = 'AIM (LSE Growth Market)';
    }
  }

  return { likelySegment, tierLabel, exchangeNameOverride, rankOverride, marketCapTrnOverride };
}

/**
 * Return a plain-English string describing the market tier for a stock,
 * suitable for inclusion in an AI prompt or displayed in the UI.
 *
 * @param exchangeCode  The exchange code from StockData (e.g. "NMS", "LSE")
 * @param marketCap     Optional market cap in USD for additional context
 */
export function describeExchangeContext(
  exchangeCode: string,
  marketCap?: number | null,
  options?: { ticker?: string },
): string {
  const ex = lookupExchange(exchangeCode, options);
  if (!ex) return '';

  const capStr =
    marketCap != null
      ? marketCap >= LARGE_CAP_THRESHOLD
        ? 'large-cap'
        : marketCap >= MID_CAP_THRESHOLD
        ? 'mid-cap'
        : 'small-cap'
      : null;

  // Determine the most likely listing tier based on code
  const upper = normalizeExchangeLookupKey(exchangeCode, options?.ticker);
  const { likelySegment, exchangeNameOverride, rankOverride, marketCapTrnOverride } =
    resolveListingMetadata(ex, upper);

  const venueName = exchangeNameOverride ?? ex.name;
  const rankStr =
    rankOverride != null
      ? `market cap rank #${rankOverride} globally`
      : exchangeNameOverride
        ? 'a major US venue'
        : 'a major global venue';
  const capTrnStr =
    marketCapTrnOverride != null ? ` with ~${marketCapTrnOverride}T USD in domestic equity` : '';
  const parts: string[] = [
    `${venueName} (${ex.region}) — ${rankStr}${capTrnStr}. Figures as of ${EXCHANGE_DATA_AS_OF}.`,
  ];

  if (likelySegment) {
    parts.push(
      `Listing segment: ${likelySegment.name} — ${likelySegment.description} ${likelySegment.notes}`,
    );
  }

  if (ex.indices.length > 0) {
    parts.push(`Key indices: ${ex.indices.slice(0, 4).join(', ')}.`);
  }

  parts.push(`Context: ${ex.practicalNote}`);

  if (capStr) {
    parts.push(`This is a ${capStr} company.`);
  }

  return parts.join(' ');
}

/**
 * Return a compact summary of the exchange for UI display.
 */
export function getExchangeSummary(exchangeCode: string, options?: { ticker?: string }): {
  name: string;
  region: string;
  rank: number | null;
  marketCapTrn: number | null;
  tier: string;
  dataAsOf: string;
  practicalNote: string;
  indices: string[];
  segments: MarketSegment[];
} | null {
  const ex = lookupExchange(exchangeCode, options);
  if (!ex) return null;

  const upper = normalizeExchangeLookupKey(exchangeCode, options?.ticker);
  const { tierLabel, exchangeNameOverride, rankOverride, marketCapTrnOverride } =
    resolveListingMetadata(ex, upper);

  return {
    name: exchangeNameOverride ?? ex.name,
    region: ex.region,
    rank: rankOverride,
    marketCapTrn: marketCapTrnOverride,
    tier: tierLabel,
    dataAsOf: EXCHANGE_DATA_AS_OF,
    practicalNote: ex.practicalNote,
    indices: ex.indices,
    segments: ex.segments,
  };
}
