import React from 'react';
import { ArrowRight } from 'lucide-react';
import { NlAsk, NlAskChoice } from '@workspace/api-client-react';
import { Slider } from '@/components/ui/slider';
import { askIcon } from './ask-icons';

/**
 * How the current interview question gets answered.
 *
 * One dispatcher on `ask.type`, mirroring the Visualizer switch in visuals.tsx.
 * The point of having five shapes is that answering gets CHEAPER as the
 * interview goes on: the owner typed the hard sentence to get in the door, and
 * everything after that should cost a tap or a drag.
 *
 * Every type reduces its answer to a plain-English string, because
 * nl_messages.content is text and the interview replays history as chat turns.
 * That keeps POST /answers' body unchanged — no request-side contract work.
 */

const SUBMIT_BTN =
  'w-11 h-11 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all';

const RECOMMENDED =
  'ml-1.5 font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground font-bold';

function ChoiceLabel({ choice }: { choice: NlAskChoice }) {
  return (
    <>
      {choice.label}
      {choice.recommended && <span className={RECOMMENDED}>(recommended)</span>}
    </>
  );
}

/** One of a few named paths. Taps straight through — no confirm step. */
const AskSingle = ({
  choices,
  disabled,
  onAnswer,
}: {
  choices: NlAskChoice[];
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {choices.map(choice => (
      <button
        key={choice.label}
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(choice.label)}
        className="px-4 py-2.5 rounded-full bg-card border border-border shadow-sm font-sans text-body font-medium text-foreground hover:border-ink-1 hover:text-ink-1 active:scale-95 transition-all disabled:opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        <ChoiceLabel choice={choice} />
      </button>
    ))}
  </div>
);

/** Several can be true at once. */
const AskMulti = ({
  choices,
  maxPick,
  disabled,
  onAnswer,
}: {
  choices: NlAskChoice[];
  maxPick?: number;
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => {
  const [picked, setPicked] = React.useState<string[]>([]);
  const cap = maxPick ?? choices.length;
  const toggle = (label: string) =>
    setPicked(p =>
      p.includes(label) ? p.filter(l => l !== label) : p.length >= cap ? p : [...p, label],
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {choices.map(choice => {
          const on = picked.includes(choice.label);
          const blocked = !on && picked.length >= cap;
          return (
            <button
              key={choice.label}
              type="button"
              disabled={disabled || blocked}
              onClick={() => toggle(choice.label)}
              className={`px-4 py-2.5 rounded-full border font-sans text-body font-medium active:scale-95 transition-all disabled:opacity-40 ${
                on
                  ? 'bg-sunken border-ink-1 text-ink-1'
                  : 'bg-card border-border text-foreground shadow-sm'
              }`}
            >
              <ChoiceLabel choice={choice} />
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled || picked.length === 0}
          onClick={() => onAnswer(picked.join(', '))}
          className={SUBMIT_BTN}
          aria-label="Send these"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Order is the answer. Tap-to-order rather than drag: dragging inside a scrolling
 * sheet on a phone is the highest-failure interaction in this whole set, and
 * there's no dnd library in the repo to lean on.
 */
const AskRank = ({
  items,
  disabled,
  onAnswer,
}: {
  items: string[];
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => {
  const [order, setOrder] = React.useState<string[]>([]);
  const toggle = (item: string) =>
    setOrder(o => (o.includes(item) ? o.filter(i => i !== item) : [...o, item]));
  const format = (list: string[]) =>
    'In order: ' + list.map((item, i) => `${i + 1}) ${item}`).join(' ');

  return (
    <div className="space-y-3">
      <div className="font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground font-bold">
        Tap in order
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const rank = order.indexOf(item);
          return (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => toggle(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left font-sans text-body font-medium active:scale-[0.98] transition-all disabled:opacity-50 ${
                rank >= 0
                  ? 'bg-sunken border-ink-1 text-ink-1'
                  : 'bg-card border-border text-foreground shadow-sm'
              }`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-mono text-kicker-lg font-bold ${
                  rank >= 0 ? 'bg-moss text-white' : 'border border-border text-muted-foreground'
                }`}
              >
                {rank >= 0 ? rank + 1 : ''}
              </span>
              <span className="min-w-0">{item}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        {/* Partial submit once most of it is ordered — an unfinished ranking
            still carries the signal, and demanding all of them is how this
            question gets abandoned. */}
        <button
          type="button"
          disabled={disabled || order.length < Math.min(2, items.length)}
          onClick={() => onAnswer(format(order))}
          className={SUBMIT_BTN}
          aria-label="Send this order"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/** A number by dragging instead of typing. */
const AskScale = ({
  ask,
  disabled,
  onAnswer,
}: {
  ask: NlAsk;
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => {
  const min = ask.min ?? 0;
  const max = ask.max ?? 10;
  const step = ask.step ?? 1;
  const [value, setValue] = React.useState(ask.startAt ?? min);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="font-sans text-metric font-bold leading-none tracking-tight text-foreground">
          {value}
        </span>
        {ask.unit && (
          <span className="ml-1.5 font-mono text-caption uppercase tracking-widest text-muted-foreground font-bold">
            {ask.unit}
          </span>
        )}
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => setValue(v ?? min)}
      />
      <div className="flex items-center justify-between font-mono text-kicker-sm uppercase tracking-widest text-muted-foreground font-bold">
        <span className="truncate">{ask.minLabel ?? min}</span>
        <span className="truncate text-right">{ask.maxLabel ?? max}</span>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(ask.unit ? `About ${value} ${ask.unit}` : `${value} out of ${max}`)}
          className={SUBMIT_BTN}
          aria-label="Send this number"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/** Picture tiles, for choices that are kinds of things rather than sentences. */
const AskImage = ({
  choices,
  disabled,
  onAnswer,
}: {
  choices: NlAskChoice[];
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3">
    {choices.map(choice => {
      const Icon = askIcon(choice.icon);
      return (
        <button
          key={choice.label}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(choice.label)}
          className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2.5 shadow-sm hover:border-ink-1 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <span className="w-12 h-12 rounded-md bg-canvas flex items-center justify-center text-foreground">
            {Icon ? (
              <Icon className="w-6 h-6" strokeWidth={1.75} />
            ) : (
              <span className="font-sans text-body-lg font-bold">
                {choice.label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span className="font-sans text-caption font-medium text-foreground text-center leading-tight">
            <ChoiceLabel choice={choice} />
          </span>
        </button>
      );
    })}
  </div>
);

/**
 * The dispatcher. `ask` absent, or a type we don't know, both land on null —
 * the caller keeps its always-available text composer, so there is never a
 * broken or empty question.
 */
export const AskInput = ({
  ask,
  disabled,
  onAnswer,
}: {
  ask?: NlAsk | null;
  disabled?: boolean;
  onAnswer: (content: string) => void;
}) => {
  if (!ask) return null;
  switch (ask.type) {
    case 'single':
      return ask.choices?.length ? (
        <AskSingle choices={ask.choices} disabled={disabled} onAnswer={onAnswer} />
      ) : null;
    case 'multi':
      return ask.choices?.length ? (
        <AskMulti
          choices={ask.choices}
          maxPick={ask.maxPick}
          disabled={disabled}
          onAnswer={onAnswer}
        />
      ) : null;
    case 'rank':
      return ask.items?.length ? (
        <AskRank items={ask.items} disabled={disabled} onAnswer={onAnswer} />
      ) : null;
    case 'scale':
      return <AskScale ask={ask} disabled={disabled} onAnswer={onAnswer} />;
    case 'image':
      return ask.choices?.length ? (
        <AskImage choices={ask.choices} disabled={disabled} onAnswer={onAnswer} />
      ) : null;
    case 'text':
    default:
      return null;
  }
};
