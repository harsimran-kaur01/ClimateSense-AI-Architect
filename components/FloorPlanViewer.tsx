import React, { useMemo, useState } from 'react';
import { FloorPlan, Room } from '../types';

interface Props {
  plan: FloorPlan;
}

export const FloorPlanViewer: React.FC<Props> = ({ plan }) => {
  const SCALE = 35;
  const PADDING = 60;

  const [showAirflow, setShowAirflow] = useState(false);
  const [showHeatRisk, setShowHeatRisk] = useState(false);
  const [showDaylight, setShowDaylight] = useState(false);

  const dimensions = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    plan.rooms.forEach(r => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });
    return {
      width: (maxX - minX) * SCALE + PADDING * 2,
      height: (maxY - minY) * SCALE + PADDING * 2,
      offsetX: minX,
      offsetY: minY
    };
  }, [plan]);

  const getRoomColor = (type: Room['type']) => {
    switch (type) {
      case 'living': return 'fill-orange-50 stroke-orange-300';
      case 'bedroom': return 'fill-indigo-50 stroke-indigo-300';
      case 'kitchen': return 'fill-amber-50 stroke-amber-300';
      case 'bathroom': return 'fill-blue-50 stroke-blue-300';
      case 'buffer': return 'fill-emerald-50 stroke-emerald-300';
      default: return 'fill-slate-100 stroke-slate-400';
    }
  };

  const roomCentroids = useMemo(() => {
    const c: Record<string, { x: number; y: number }> = {};
    plan.rooms.forEach(r => {
      c[r.name.toLowerCase()] = {
        x: (r.x - dimensions.offsetX) * SCALE + PADDING + (r.width * SCALE) / 2,
        y: (r.y - dimensions.offsetY) * SCALE + PADDING + (r.height * SCALE) / 2
      };
    });
    return c;
  }, [plan, dimensions]);

  // Helper function to find centroid with fuzzy matching
  const findCentroid = (roomRef: string) => {
    const ref = roomRef.toLowerCase().trim();
    
    // Exact match first
    if (roomCentroids[ref]) {
      return roomCentroids[ref];
    }
    
    // Partial match - check if either contains the other
    const match = Object.entries(roomCentroids).find(([key]) => 
      key.includes(ref) || ref.includes(key)
    );
    
    return match?.[1];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-700">Passive Climate Diagnostics</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowHeatRisk(!showHeatRisk)}
            className={`px-2 py-1 text-[9px] font-bold rounded border ${
              showHeatRisk ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'
            }`}
          >HEAT</button>

          <button onClick={() => setShowAirflow(!showAirflow)}
            className={`px-2 py-1 text-[9px] font-bold rounded border ${
              showAirflow ? 'bg-sky-500 text-white' : 'bg-white text-slate-400'
            }`}
          >AIR</button>

          <button onClick={() => setShowDaylight(!showDaylight)}
            className={`px-2 py-1 text-[9px] font-bold rounded border ${
              showDaylight ? 'bg-amber-400 text-white' : 'bg-white text-slate-400'
            }`}
          >LIGHT</button>
        </div>
      </div>

      {/* PLAN */}
      <div className="p-8 overflow-auto flex justify-center min-h-[400px]">
        <svg width={dimensions.width} height={dimensions.height}>
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9" />
            </marker>
          </defs>

          {plan.rooms.map(room => {
            const rx = (room.x - dimensions.offsetX) * SCALE + PADDING;
            const ry = (room.y - dimensions.offsetY) * SCALE + PADDING;
            const rw = room.width * SCALE;
            const rh = room.height * SCALE;

            const heatRisk =
              plan.diagnostics?.heat_risk?.find(z =>
                z.room.toLowerCase().includes(room.name.toLowerCase()) ||
                room.name.toLowerCase().includes(z.room.toLowerCase())
              );

            const daylight =
              plan.diagnostics?.daylight?.find(z =>
                z.room.toLowerCase().includes(room.name.toLowerCase()) ||
                room.name.toLowerCase().includes(z.room.toLowerCase())
              );

            return (
              <g key={room.id}>
                <rect x={rx} y={ry} width={rw} height={rh}
                  className={`${getRoomColor(room.type)} stroke-2`} />

                {/* HEAT RISK OVERLAY */}
                {showHeatRisk && heatRisk && (
                  <rect x={rx} y={ry} width={rw} height={rh}
                    fill="#f43f5e"
                    fillOpacity={
                      heatRisk.level === 'high' ? 0.45 :
                      heatRisk.level === 'medium' ? 0.25 :
                      0.1
                    } />
                )}

                {/* DAYLIGHT OVERLAY */}
                {showDaylight && daylight && (
                  <rect x={rx} y={ry} width={rw} height={rh}
                    fill={
                      daylight.quality === 'high' ? '#fbbf24' :
                      daylight.quality === 'medium' ? '#94a3b8' :
                      '#64748b'
                    }
                    fillOpacity={0.3} />
                )}

                <text x={rx + rw / 2} y={ry + rh / 2}
                  textAnchor="middle"
                  className="fill-slate-700 text-[10px] font-bold">
                  {room.name}
                </text>
              </g>
            );
          })}

          {/* AIRFLOW PATHS - Using robust room name matching */}
          {showAirflow && plan.diagnostics?.airflow?.map((flow, i) => {
            const from = findCentroid(flow.from);
            const to = findCentroid(flow.to);

            if (!from || !to) return null;

            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#0ea5e9"
                strokeWidth={flow.efficiency === 'high' ? 3 : 2}
                strokeOpacity={flow.efficiency === 'high' ? 0.9 : 0.6}
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};