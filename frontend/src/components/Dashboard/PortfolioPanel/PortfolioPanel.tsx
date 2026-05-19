import { useState } from "react";
import PortfolioOverview from "./PortfolioOverview";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import OpenPositions from "./OpenPositions";

// ===== TYPES =====
type PanelType = "OVERVIEW" | "POSITIONS";

export default function PortfolioPanel() {
  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<PanelType>("OVERVIEW");

  return (
    <div className="px-7.5">
      <Tabs
        onValueChange={(value) => setActiveTab(value as PanelType)}
        value={activeTab}
      >
        {/* ===== TABS LIST ===== */}
        <TabsList className="mb-2">
          <TabsTrigger
            className="text-xl cursor-pointer"
            value="OVERVIEW"
            onClick={() => setActiveTab("OVERVIEW")}
          >
            Portfolio Overview
          </TabsTrigger>
          <TabsTrigger
            className="text-xl cursor-pointer"
            value="POSITIONS"
            onClick={() => setActiveTab("POSITIONS")}
          >
            Open Positions
          </TabsTrigger>
        </TabsList>
        <TabsContents>
          {/* ===== OVERVIEW ===== */}
          <TabsContent value="OVERVIEW">
            <PortfolioOverview />
          </TabsContent>
          {/* ===== POSITIONS ===== */}
          <TabsContent value="POSITIONS">
            <OpenPositions />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
