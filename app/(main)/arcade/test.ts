const MAX_CARD = 10;
const DECK_SUM = 28;

// --- правила ---

function beats(a, b) {
    if (a === b) return 0;
    if (a === 1 && b === MAX_CARD) return 1;
    if (a === MAX_CARD && b === 1) return -1;
    return a > b ? 1 : -1;
  }
  
  function match(deck1, deck2) {
    let score = 0;
  
    for (let i = 0; i < 5; i++) {
      score += beats(deck1[i], deck2[i]);
    }
  
    if (score > 0) return 1;
    if (score < 0) return 0;
    return 0.5;
  }
  
  // --- генерация колод (с отсечениями) ---
  
  function generateDecks(allowedSums = [DECK_SUM]) {
    const maxAllowed = Math.max(...allowedSums);
    const minAllowed = Math.min(...allowedSums);
    const decks = [];
  
    function dfs(pos, current, sum) {
      if (pos === 5) {
        if (allowedSums.includes(sum)) {
          decks.push([...current]);
        }
        return;
      }
  
      const remaining = 5 - pos;
  
      const minSum = sum + remaining * 1;
      if (minSum > maxAllowed) return;

      const maxSum = sum + remaining * MAX_CARD;
      if (maxSum < minAllowed) return;
  
      for (let val = 1; val <= MAX_CARD; val++) {
        current.push(val);
        dfs(pos + 1, current, sum + val);
        current.pop();
      }
    }
  
    dfs(0, [], 0);
    return decks;
  }
  
  // --- генерация колод без повторов ---

  function generateUniqueDecks() {
    const decks = [];

    function dfs(pos, current, sum, used) {
      if (pos === 5) {
        if (sum === DECK_SUM) {
          decks.push([...current]);
        }
        return;
      }

      const remaining = 5 - pos;

      // pruning: минимальная сумма оставшихся (наименьшие неиспользованные)
      const available = [];
      for (let v = 1; v <= MAX_CARD; v++) if (!used[v]) available.push(v);
      if (available.length < remaining) return;

      const minSum = sum + available.slice(0, remaining).reduce((a, b) => a + b, 0);
      if (minSum > DECK_SUM) return;

      const maxSum = sum + available.slice(-remaining).reduce((a, b) => a + b, 0);
      if (maxSum < DECK_SUM) return;

      for (const val of available) {
        used[val] = true;
        current.push(val);
        dfs(pos + 1, current, sum + val, used);
        current.pop();
        used[val] = false;
      }
    }

    dfs(0, [], 0, {});
    return decks;
  }

  // --- форматирование вывода ---

  function fmt(deck, winrate) {
    const sum = deck.reduce((a, b) => a + b, 0);
    return `[${deck.join(", ")}] sum=${sum}  ${(winrate * 100).toFixed(2)}%`;
  }

  // --- дедупликация по мультисету ---

  function deduplicateByMultiset(combined) {
    const seen = new Map();
    for (const entry of combined) {
      const key = [...entry.deck].sort((a, b) => a - b).join(",");
      if (!seen.has(key)) seen.set(key, { ...entry, deck: [...entry.deck].sort((a, b) => a - b) });
    }
    return Array.from(seen.values());
  }

  // --- расчет винрейтов ---
  
  function computeWinrates(decks) {
    const n = decks.length;
    const winrates = new Array(n).fill(0);
  
    for (let i = 0; i < n; i++) {
      let total = 0;
  
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        total += match(decks[i], decks[j]);
      }
  
      winrates[i] = total / (n - 1);
    }
  
    return winrates;
  }
  
  // --- main ---
  
  function main() {
    const decks = generateDecks();
    console.log("Total decks:", decks.length);
  
    const decksWithAce = decks.filter(d => d.includes(1)).length;
    console.log("Decks with ace (1):", decksWithAce, `(${(decksWithAce / decks.length * 100).toFixed(1)}%)`);

    const winrates = computeWinrates(decks);
  
    const combined = decks.map((deck, i) => ({
      deck,
      winrate: winrates[i],
    }));
  
    combined.sort((a, b) => b.winrate - a.winrate);
    const deduped = deduplicateByMultiset(combined);
    deduped.sort((a, b) => b.winrate - a.winrate);

    console.log("\nTop 5 decks:");
    for (let i = 0; i < 5; i++) {
      console.log(fmt(deduped[i].deck, deduped[i].winrate));
    }
  
    console.log("\nWorst 5 decks:");
    for (let i = deduped.length - 5; i < deduped.length; i++) {
      console.log(fmt(deduped[i].deck, deduped[i].winrate));
    }

    // --- уникальные карты в колоде ---
    console.log("\n=== Unique cards only ===");
    const uniqueDecks = generateUniqueDecks();
    console.log("Total unique decks:", uniqueDecks.length);

    const uniqueWinrates = computeWinrates(uniqueDecks);
    const uniqueCombined = uniqueDecks.map((deck, i) => ({ deck, winrate: uniqueWinrates[i] }));
    const uniqueDeduped = deduplicateByMultiset(uniqueCombined);
    uniqueDeduped.sort((a, b) => b.winrate - a.winrate);

    console.log("\nTop 5 unique decks:");
    for (let i = 0; i < 5; i++) {
      console.log(fmt(uniqueDeduped[i].deck, uniqueDeduped[i].winrate));
    }

    console.log("\nWorst 5 unique decks:");
    for (let i = uniqueDeduped.length - 5; i < uniqueDeduped.length; i++) {
      console.log(fmt(uniqueDeduped[i].deck, uniqueDeduped[i].winrate));
    }
  }
  
  main();

// --- поиск лучшего контрпика против [1,1,8,9,9] ---

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  // убираем дубли
  const seen = new Set();
  return result.filter(p => {
    const key = p.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function winrateVsTarget(deck, targetPerms) {
  let total = 0;
  for (const tp of targetPerms) {
    total += match(deck, tp);
  }
  return total / targetPerms.length;
}

function findBestCounter() {
  const target = [1, 1, 8, 9, 9];
  const targetPerms = permutations(target);

  const decks = generateDecks();
  const winrates = computeWinrates(decks);

  // для каждой колоды: винрейт против всех перестановок таргета
  const results = decks.map((deck, i) => ({
    deck,
    vsTarget: winrateVsTarget(deck, targetPerms),
    overall: winrates[i],
  }));

  results.sort((a, b) => b.vsTarget - a.vsTarget || b.overall - a.overall);
  const dedupedCounters = deduplicateByMultiset(results).sort(
    (a, b) => b.vsTarget - a.vsTarget || b.overall - a.overall
  );

  console.log("\n=== Best counter vs [1,1,8,9,9] ===");
  console.log("Target permutations:", targetPerms.length);
  console.log("\nTop 10 counters:");
  for (let i = 0; i < 10; i++) {
    const r = dedupedCounters[i];
    const sum = r.deck.reduce((a, b) => a + b, 0);
    console.log(
      `[${r.deck.join(", ")}] sum=${sum}`,
      `vs target: ${(r.vsTarget * 100).toFixed(1)}%`,
      `| overall: ${(r.overall * 100).toFixed(2)}%`
    );
  }
}

findBestCounter();

// --- мульти-сумма: 25-28 ---

function mainMultiSum() {
  const sums = [27, 28];
  const decks = generateDecks(sums);
  console.log(`\n=== Multi-sum pool (${sums.join(", ")}) ===`);
  console.log("Total decks:", decks.length);
  console.log("(pool замкнут относительно перестановок: каждая перестановка не меняет сумму → тоже в пуле)");

  const winrates = computeWinrates(decks);
  const combined = decks.map((deck, i) => ({ deck, winrate: winrates[i] }));
  const deduped = deduplicateByMultiset(combined);
  deduped.sort((a, b) => b.winrate - a.winrate);

  console.log("\nTop 10 decks:");
  for (let i = 0; i < 100; i++) {
    console.log(fmt(deduped[i].deck, deduped[i].winrate));
  }

  console.log("\nWorst 10 decks:");
  for (let i = deduped.length - 10; i < deduped.length; i++) {
    console.log(fmt(deduped[i].deck, deduped[i].winrate));
  }
}

mainMultiSum();