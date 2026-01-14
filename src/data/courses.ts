// Course interface with db_key for backend communication
export interface Course {
  id: string;      // db_key for backend
  name: string;    // display name
}

// Define courses per batch and term (id = db_key, name = display_name)
export const COURSES_BY_BATCH_TERM: Record<string, Record<string, Course[]>> = {
  "2029": {
    "term1": [
      { id: "AIML", name: "How do machines see, hear or speak" },
      { id: "Calculus", name: "Calculus" },
      { id: "Dropshipping", name: "Dropshipping" },
      { id: "PublicSpeaking", name: "How to own a stage" },
      { id: "OOP", name: "OOP" },
      { id: "DRP101", name: "How to build a dropshipping business" },
      { id: "FinanceBasics", name: "How to understand basic financial terminology" },
      { id: "LA101", name: "How to decode global trends and navigate economic transformations" },
      { id: "MarketAnalysis", name: "How to read market for better decision making" },
      { id: "Startup", name: "How to validate, shape, and launch a startup" },
      { id: "Networking", name: "How to network effortlessly" },
      { id: "Excel", name: "How to use excel" },
      { id: "Statistics", name: "How to use statistics to build a better business" },
      { id: "MarketGaps", name: "How to identify gaps in the market" },
      { id: "MetaMarketing", name: "How to execute digital marketing on Meta" },
      { id: "CRO", name: "How to execute CRO and increase AOV" },
    ],
    "term2": [
      { id: "CareerLabs", name: "Career Labs" },
      { id: "OfflineMarket", name: "How to Crack the offline Market" },
      { id: "GlobalStartupEcon", name: "How to understand the Economics for Global Start-up ecosystem" },
      { id: "D2CBusiness", name: "How to build a D2C Business" },
      { id: "CapstoneHours", name: "Capstone Hours" },
      { id: "BusinessMetrics", name: "How to use Business Metrics to Enhance Efficiency and Drive Innovation" },
      { id: "TaxesCompliance", name: "How to understand Taxes and Compliances" },
      { id: "EconomicForces", name: "How to understand Economics Forces that Shape the World" },
      { id: "WorldCultures", name: "How to Connect World Cultures With Business Practices for Competitive Advantage" },
      { id: "AIMarketing", name: "How can AI improve Marketing Strategies" },
      { id: "BillionDollarBrand", name: "How to Influence Consumers to Build a Billion Dollar Brand" },
    ],
  },
  "2028": {
    "term3": [
      { id: "KickstarterCampaign", name: "How to build a Kickstarter campaign?" },
      { id: "ProductDesignKickstarter", name: "How to develop and design a product for kickstarter success?" },
      { id: "FundraisingVideo", name: "How to craft a fundraising video that converts?" },
      { id: "CapstoneHours", name: "Capstone Hours" },
      { id: "Web3Innovation", name: "How to leverage web3 for entrepreneurial innovation" },
      { id: "BusinessMetrics", name: "How to use business metrics to enhance efficiency and drive innovation" },
      { id: "FundraisingStartups", name: "How can founders raise money for their start-ups" },
      { id: "IPProtection", name: "How to protect your ideas and innovations" },
      { id: "AIPython", name: "How to design AI-powered solutions with Python" },
      { id: "PublicSpeakingLevel2", name: "How to own a stage – Level 2" },
      { id: "CopywritingSells", name: "How to craft compelling copy that sells and builds trust" },
      { id: "SingaporePolicy", name: "Understanding modern Southeast Asia through Singaporean public policy" },
      { id: "EconomicForces", name: "How to understand economic forces that shape the world" },
      { id: "CompetitiveStrategy", name: "How can my business win against the competition" },
      { id: "NUSImmersion", name: "Strategy and innovation immersion at NUS" },
      { id: "CustomerInsights", name: "How to uncover what customers really want" },
    ],
    "term4": [
      { id: "NudgeBehavior", name: "How to Nudge to understand human behaviour" },
      { id: "SustainableNudges", name: "How to use nudges to promote sustainable and healthy behaviors" },
      { id: "FinancialModels", name: "How to build Financial Models?" },
      { id: "ImpactInvestor", name: "How to Think Like an Impact Investor: Risk, Return, and SROI" },
      { id: "TalentManagement", name: "How to attract, manage, and retain talent" },
      { id: "CrossCulturalLeadership", name: "How to negotiate and lead across diverse cultures and stakeholders" },
      { id: "NonProfitBrand", name: "How to position & market your non-profit brand" },
      { id: "SocialImpactVentures", name: "How to design and scale ventures delivering social impact with limited resources?" },
    ],
  },
};
