import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";

// ===== Helpers =====
const money = (v, ccy) => new Intl.NumberFormat(undefined, { style: "currency", currency: ccy }).format(isFinite(v) ? v : 0);
const num = (v) => new Intl.NumberFormat(undefined).format(isFinite(v) ? v : 0);
const pct = (v) => `${(isFinite(v) ? v * 100 : 0).toFixed(1)}%`;

function NumberInput({ value, onChange, step = 1, min, max, suffix, ...rest }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="number" value={value} onChange={(e)=>onChange(e.target.value===""?0:Number(e.target.value))} step={step} min={min} max={max} {...rest}/>
      {suffix ? <span className="text-sm text-muted-foreground select-none">{suffix}</span> : null}
    </div>
  );
}
function PercentInput({ value, onChange }) {
  return <NumberInput value={Math.round((value||0)*1000)/10} step={0.1} min={0} max={999} suffix="%" onChange={(n)=>onChange(Number(n)/100)}/>;
}
function MoneyInput({ value, onChange, currency }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-6 text-right">{currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$"}</span>
      <Input type="number" step={1} value={value} onChange={(e)=>onChange(e.target.value===""?0:Number(e.target.value))}/>
    </div>
  );
}

function Field({ label, tip, input }){
  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <Label className="col-span-7 flex items-center gap-1">
        {label}
        {tip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help"/>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
          </Tooltip>
        )}
      </Label>
      <div className="col-span-5">{input}</div>
    </div>
  );
}

// ===== Simple CS model with Pro-only licensing and deal-close uplift =====
const DEFAULTS = {
  currency: "GBP",
  // Volume (assume all calls are CS)
  agents: 25,
  workdays: 240,
  calls_per_day: 20,
  // Scoring coverage and effort
  baseline_manual_coverage: 0.15, // 15% today
  manual_minutes: 8,
  auto_coverage: 0.95, // closer to full coverage
  auto_review_minutes: 1,
  qa_hourly_cost: 45,
  // CS impact (AHT + Repeat)
  baseline_aht_minutes: 8,
  aht_reduction_percent: 0.05,
  agent_hourly_cost: 30,
  repeat_rate: 0.25,
  repeat_reduction_percent: 0.05,
  cost_per_repeat_contact: 5,
  // Deal close uplift (optional but simple)
  opp_rate: 0.10, // share of CS calls with a commercial opportunity
  deal_close_rate: 0.20,
  deal_close_lift: 0.05, // relative lift from better coaching
  margin_per_deal: 300,
  // Licensing: Pro only
  pro_price: 49,
  pro_seats: 25,
};

function calc(x){
  // All calls are CS
  const calls_year = x.agents * x.calls_per_day * x.workdays;

  // Labor savings: replace manual-scored coverage with automated-scored coverage
  const baseline_qa_hours = calls_year * x.baseline_manual_coverage * x.manual_minutes / 60;
  const auto_qa_hours = calls_year * x.auto_coverage * x.auto_review_minutes / 60;
  const labor_savings = (baseline_qa_hours - auto_qa_hours) * x.qa_hourly_cost;

  // CS impact (AHT + repeat)
  const aht_minutes_saved = calls_year * x.baseline_aht_minutes * x.aht_reduction_percent;
  const aht_cost_savings = (aht_minutes_saved / 60) * x.agent_hourly_cost;
  const repeats_avoided = calls_year * x.repeat_rate * x.repeat_reduction_percent;
  const repeat_savings = repeats_avoided * x.cost_per_repeat_contact;

  // Deal close uplift on commercial opportunities within CS calls
  const opp_calls = calls_year * x.opp_rate;
  const baseline_deals = opp_calls * x.deal_close_rate;
  const incremental_deals = baseline_deals * x.deal_close_lift;
  const deal_benefit = incremental_deals * x.margin_per_deal;

  const performance_benefit = Math.max(0, aht_cost_savings) + Math.max(0, repeat_savings) + Math.max(0, deal_benefit);

  // Licensing cost: Pro only
  const license_cost_year = 12 * (x.pro_seats * x.pro_price);

  // Total cost and ROI
  const annual_cost = license_cost_year;
  const total_benefit = Math.max(0, labor_savings) + performance_benefit;
  const net = total_benefit - annual_cost;
  const roi = annual_cost > 0 ? net / annual_cost : 0;
  const payback = total_benefit > 0 ? 12 * (annual_cost / total_benefit) : NaN;

  return {
    calls_year,
    labor_savings,
    aht_cost_savings,
    repeat_savings,
    deal_benefit,
    performance_benefit,
    license_cost_year,
    annual_cost,
    total_benefit,
    net,
    roi,
    payback,
  };
}

export default function SimpleCSROICalculator(){
  const [s, set] = useState(DEFAULTS);
  const r = useMemo(()=>calc(s),[s]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto max-w-5xl p-6 grid gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Automated Call Scoring - Simple ROI (Customer Success)</h1>
            <p className="text-sm text-muted-foreground">Assumes all calls are CS. Pro-only licensing. Now with deal close uplift.</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-1 text-sm" value={s.currency} onChange={(e)=>set({...s, currency:e.target.value})}>
              <option value="GBP">GBP £</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
            <Button variant="secondary" onClick={()=>set(DEFAULTS)}><RefreshCw className="w-4 h-4 mr-2"/>Reset</Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {/* Volume */}
              <Field label="Agents" tip="Number of agents whose calls will be scored and coached." input={<NumberInput value={s.agents} min={0} onChange={(v)=>set({...s,agents:v})}/>}/>
              <Field label="Calls per agent per day" tip="Typical calls handled per agent in a working day." input={<NumberInput value={s.calls_per_day} min={0} onChange={(v)=>set({...s,calls_per_day:v})}/>}/>
              <Field label="Workdays per year" tip="Working days in a year after holidays and PTO." input={<NumberInput value={s.workdays} min={0} onChange={(v)=>set({...s,workdays:v})}/>}/>

              <hr/>
              {/* Scoring coverage and effort */}
              <Field label="Manual scoring coverage" tip="Percent of calls manually scored today." input={<PercentInput value={s.baseline_manual_coverage} onChange={(v)=>set({...s,baseline_manual_coverage:v})}/>}/>
              <Field label="Auto scoring coverage" tip="Percent of calls automatically scored with AI (often near full coverage)." input={<PercentInput value={s.auto_coverage} onChange={(v)=>set({...s,auto_coverage:v})}/>}/>
              <Field label="Manual minutes per scored call" tip="Average time to manually score one call." input={<NumberInput value={s.manual_minutes} min={0} step={0.1} onChange={(v)=>set({...s,manual_minutes:v})}/>}/>
              <Field label="Auto review minutes per scored call" tip="Average time to review an automatically scored call sample." input={<NumberInput value={s.auto_review_minutes} min={0} step={0.1} onChange={(v)=>set({...s,auto_review_minutes:v})}/>}/>
              <Field label="QA hourly cost" tip="Fully loaded hourly cost for scoring/reviews." input={<MoneyInput currency={s.currency} value={s.qa_hourly_cost} onChange={(v)=>set({...s,qa_hourly_cost:v})}/>}/>

              <hr/>
              {/* CS impact */}
              <Field label="Baseline AHT (minutes)" tip="Average handle time for CS calls today." input={<NumberInput value={s.baseline_aht_minutes} min={0} step={0.1} onChange={(v)=>set({...s,baseline_aht_minutes:v})}/>}/>
              <Field label="Expected AHT reduction" tip="Estimated AHT reduction from better behaviors and coaching driven by scoring." input={<PercentInput value={s.aht_reduction_percent} onChange={(v)=>set({...s,aht_reduction_percent:v})}/>}/>
              <Field label="Agent hourly cost" tip="Fully loaded hourly cost for agents handling CS calls." input={<MoneyInput currency={s.currency} value={s.agent_hourly_cost} onChange={(v)=>set({...s,agent_hourly_cost:v})}/>}/>
              <Field label="Baseline repeat contact rate" tip="Percent of CS interactions that result in a repeat contact from the same customer." input={<PercentInput value={s.repeat_rate} onChange={(v)=>set({...s,repeat_rate:v})}/>}/>
              <Field label="Expected repeat contact reduction" tip="Reduction in repeat contacts from improved quality and consistency." input={<PercentInput value={s.repeat_reduction_percent} onChange={(v)=>set({...s,repeat_reduction_percent:v})}/>}/>
              <Field label="Cost per repeat contact" tip="Operational cost of handling one repeat contact (time, channel, tooling)." input={<MoneyInput currency={s.currency} value={s.cost_per_repeat_contact} onChange={(v)=>set({...s,cost_per_repeat_contact:v})}/>}/>

              <hr/>
              {/* Deal close uplift */}
              <Field label="Percent of calls with a deal opportunity" tip="Share of CS calls where there is an upsell, renewal, or expansion opportunity." input={<PercentInput value={s.opp_rate} onChange={(v)=>set({...s,opp_rate:v})}/>}/>
              <Field label="Baseline deal close rate" tip="Typical close rate on those opportunities today." input={<PercentInput value={s.deal_close_rate} onChange={(v)=>set({...s,deal_close_rate:v})}/>}/>
              <Field label="Expected close rate improvement" tip="Relative improvement from faster feedback and better coaching." input={<PercentInput value={s.deal_close_lift} onChange={(v)=>set({...s,deal_close_lift:v})}/>}/>
              <Field label="Margin per closed deal" tip="Average contribution margin for a closed deal/renewal/expansion." input={<MoneyInput currency={s.currency} value={s.margin_per_deal} onChange={(v)=>set({...s,margin_per_deal:v})}/>}/>

              <hr/>
              {/* Licensing - Pro only */}
              <Field label="Pro price per license per month" tip="Monthly price for each Pro seat used by supervisors, admins, and agents who view scores." input={<MoneyInput currency={s.currency} value={s.pro_price} onChange={(v)=>set({...s,pro_price:v})}/>}/>
              <Field label="Pro seats" tip="Total Pro seats across agents and managers who will use scoring." input={<NumberInput value={s.pro_seats} min={0} onChange={(v)=>set({...s,pro_seats:v})}/>}/>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Annual net benefit</div>
                  <div className="text-xl font-semibold">{money(r.net, s.currency)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ROI percent</div>
                  <div className="text-xl font-semibold">{pct(r.roi)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payback months</div>
                  <div className="text-xl font-semibold">{isFinite(r.payback) ? r.payback.toFixed(1) : "N/A"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded border">
                  <div className="font-medium mb-1">Volume</div>
                  <div>Calls per year: <span className="font-semibold">{num(r.calls_year)}</span></div>
                </div>
                <div className="p-3 rounded border">
                  <div className="font-medium mb-1">Benefits</div>
                  <div>Labor savings: <span className="font-semibold">{money(r.labor_savings, s.currency)}</span></div>
                  <div>AHT savings: <span className="font-semibold">{money(r.aht_cost_savings, s.currency)}</span></div>
                  <div>Repeat contact savings: <span className="font-semibold">{money(r.repeat_savings, s.currency)}</span></div>
                  <div>Deal revenue lift: <span className="font-semibold">{money(r.deal_benefit, s.currency)}</span></div>
                  <div className="border-t mt-1 pt-1">Total performance benefit: <span className="font-semibold">{money(r.performance_benefit, s.currency)}</span></div>
                </div>
                <div className="p-3 rounded border">
                  <div className="font-medium mb-1">Costs</div>
                  <div>License cost per year (Pro only): <span className="font-semibold">{money(r.license_cost_year, s.currency)}</span></div>
                  <div>Total annual cost: <span className="font-semibold">{money(r.annual_cost, s.currency)}</span></div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">Notes: This simplified model assumes all seats are Pro and all calls are CS. Auto scoring usually increases coverage while reducing review time per call.</div>
              <div className="text-xs text-muted-foreground">Assumption: Labor savings = (manual coverage × manual minutes − auto coverage × auto review minutes) × QA hourly cost × total calls.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
