import { useRef, useEffect, useState } from 'react';
import '@/styles/features/accelerators/AcceleratorTabs.css';
import type { AcceleratorDetail } from '@/types/models/accelerator';

interface AcceleratorTabsProps {
  accelerators: AcceleratorDetail[];
  activeAcceleratorId: string;
  onTabChange: (accelerator: AcceleratorDetail) => void;
}

const AcceleratorTabs = ({ accelerators, activeAcceleratorId, onTabChange }: AcceleratorTabsProps) => {
  const tabsGroupRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Find the active tab index
  const activeIndex = accelerators.findIndex(acc => acc.id === activeAcceleratorId);

  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    const tabsGroup = tabsGroupRef.current;

    if (activeTab && tabsGroup) {
      const groupRect = tabsGroup.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - groupRect.left,
        width: tabRect.width,
      });
    }
  }, [activeIndex, accelerators]);

  return (
    <section className="accelerator-tabs">
      <div className="tabs-container">
        <div className="tabs-group" ref={tabsGroupRef}>
          {/* Sliding indicator */}
          <div
            className="tab-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
            }}
          />
          {accelerators.map((acc, index) => (
            <button
              key={acc.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              className={`tab-item ${activeAcceleratorId === acc.id ? 'active' : ''}`}
              onClick={() => onTabChange(acc)}
            >
              {acc.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcceleratorTabs;
