# Tomb Raiders 🏺

A blockchain-based dueling game where two players compete to crack each other's secret 4-digit codes first. Think Mastermind meets ancient Egypt, powered by smart contracts.

## The Magic of Seamless Gameplay ✨

Here's where it gets cool: you only sign **once** when you start playing. That's it.

We use **subaccounts with auto spend permissions**, which means after that initial signature, all your game moves happen instantly without bugging you for approval every single time. No more "sign this, approve that" for every guess you make. Just pure, uninterrupted gameplay.

It's like giving the game a prepaid card with a spending limit - you authorize it once, and then you can focus on actually playing instead of babysitting your wallet.

## What's This All About?

Tomb Raiders is a turn-based strategy game where:

1. **You seal your tomb** - Pick a secret 4-digit code and lock it on-chain with a wager
2. **Face your opponent** - Take turns trying to excavate (guess) each other's codes
3. **Get clues** - After each guess, you learn how many digits are correct and in the right position
4. **Race to victory** - First player to crack the code wins the pot

Think of it as a high-stakes code-breaking duel with an ancient Egyptian twist. No complex encryption stuff - just pure strategy and deduction.

## How It Works

- **Choose Your Code**: Any 4-digit combination from 0000 to 9999
- **Place Your Wager**: Both players contribute to the prize pool
- **Excavate & Deduce**: Use feedback from each guess to narrow down possibilities
- **Winner Takes All**: Crack the code first, claim pharaoh's gold

## Tech Stack

- **React + TypeScript** - Because we like our code typed and our components reactive
- **Vite** - Fast builds, faster refreshes
- **Tailwind CSS** - For that beautiful desert aesthetic
- **Smart Contracts** - Your game state lives on-chain
- **Wagmi + RainbowKit** - Wallet connection made easy
- **Base Subaccounts** - The secret sauce for seamless transactions

## Running Locally

```sh
# Clone it
git clone <YOUR_GIT_URL>

# Jump in
cd tomb-raiders

# Install dependencies
npm i

# Fire it up
npm run dev
```

Then head to `localhost:8080` and start raiding tombs.

## The Vibe

We ditched the cyberpunk vault-cracking theme for something with more... historical flair. Ancient tombs, hieroglyphs, sacred codes, and desert mysteries. Same addictive gameplay, way cooler aesthetic.

---

*May the ancient spirits guide your guesses* 🔮
