import React from 'react';
import { ClimateData } from '../types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';

interface Props {
  data: ClimateData;
  metrics?: {
    naturalLightScore: number;        // 0–1
    ventilationEfficiency: number;    // 0–1
    thermalMassUtilization: number;   // 0–1
    solarControlRating: number;       // 0–1
  };
}

export const ClimateCard: React.FC<Props> = ({ data, metrics }) => {
  const radarData = metrics
    ? [
        { subject: 'Daylight', value: Math.round(metrics.naturalLightScore * 100) },
        { subject: 'Ventilation', value: Math.round(metrics.ventilationEfficiency * 100) },
        { subject: 'Thermal Mass', value: Math.round(metrics.thermalMassUtilization * 100) },
        { subject: 'Solar Control', value: Math.round(metrics.solarControlRating * 100) }
      ]
    : [];

  const avgScore = metrics
    ? Math.round(
        ((metrics.naturalLightScore +
          metrics.ventilationEfficiency +
          metrics.thermalMassUtilization +
          metrics.solarControlRating) /
          4) *
          100
      )
    : null;

  // Calculate actual performance estimates based on metrics
  const coolingReduction = metrics
    ? Math.round(15 + metrics.solarControlRating * 20 + metrics.ventilationEfficiency * 15)
    : null;

  const daylightImprovement = metrics
    ? Math.round(30 + metrics.naturalLightScore * 30)
    : null;

  const ventilationCoverage = metrics
    ? metrics.ventilationEfficiency > 0.7 ? 'High' :
      metrics.ventilationEfficiency > 0.4 ? 'Medium' : 'Low'
    : null;

  const solarExposure = metrics
    ? metrics.solarControlRating > 0.7 ? 'Minimized' :
      metrics.solarControlRating > 0.4 ? 'Controlled' : 'Needs Improvement'
    : null;

  return (
    <div className="space-y-6">
      {/* CLIMATE SUMMARY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{data.location}</h2>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
              {data.climateZone}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-700">
              {data.averageTemp.min}° – {data.averageTemp.max}°C
            </div>
            <div className="text-xs text-slate-400">Annual Average</div>
          </div>
        </div>

        {/* CHALLENGES */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-rose-500 tracking-widest">
              Climate Challenges
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.climate_challenges.map((c, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-rose-50 text-rose-700 text-[11px] font-medium rounded-full border border-rose-100"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* STRATEGIES */}
          <div>
            <label className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">
              Passive Design Strategies
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.design_strategies.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-full border border-emerald-100"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RADAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 h-64">
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 text-center">
              Climate Performance Index
            </label>

            <ResponsiveContainer width="100%" height="90%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* NUMERIC SUMMARY - Now with calculated values */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-600">
                {avgScore}%
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Overall Passive Efficiency
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600">
              <li>• Estimated cooling load reduction: <b>{coolingReduction}%</b></li>
              <li>• Daylight autonomy improvement: <b>{daylightImprovement}%</b></li>
              <li>• Cross-ventilation coverage: <b>{ventilationCoverage}</b></li>
              <li>• West solar exposure: <b>{solarExposure}</b></li>
            </ul>
          </div>
        </div>
      )}

      {/* GUIDANCE */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="border-l-4 border-emerald-400 pl-3">
          <h4 className="text-[10px] uppercase font-black text-slate-400 mb-1">
            Orientation Logic
          </h4>
          <p className="text-xs text-slate-600 italic">
            "{data.orientation_guidance}"
          </p>
        </div>

        <div className="border-l-4 border-sky-400 pl-3">
          <h4 className="text-[10px] uppercase font-black text-slate-400 mb-1">
            Fenestration Strategy
          </h4>
          <p className="text-xs text-slate-600 italic">
            "{data.window_guidance}"
          </p>
        </div>

        <div className="border-l-4 border-amber-400 pl-3">
          <h4 className="text-[10px] uppercase font-black text-slate-400 mb-1">
            Thermal Zoning
          </h4>
          <p className="text-xs text-slate-600 italic">
            "{data.zoning_guidance}"
          </p>
        </div>
      </div>
    </div>
  );
};