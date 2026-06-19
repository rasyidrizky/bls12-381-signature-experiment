# BLS12-381 Signature Aggregation Benchmark

<div align="center">
    <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License MIT" />
</div>

## Overview
This repository contains a vanilla Node.js simulation framework designed to empirically evaluate the computational latency and storage overhead of the **BLS12-381 signature aggregation scheme**. It benchmarks traditional linear signature validation against aggregated verification to demonstrate its efficiency in large-scale Proof-of-Stake (PoS) blockchain systems.

This project was developed as part of the academic research for the **II4021 Cryptography** course at the **Institut Teknologi Bandung (ITB)**.

## Key Features
* Compares $O(n)$ linear verification time against the $O(1)$ constant-time bilinear pairing check.
* Simulates validator sets ranging from $N = 10$ up to $N = 1000$ nodes.
* Accurately measures the physical data footprint (in bytes) of unaggregated credentials (signatures + public keys) versus a single aggregated payload.
* Automatically trims the top/bottom 5% of execution outliers to bypass OS background noise and Just-In-Time (JIT) compilation delays.
* Generates high-resolution PNG line charts and bar charts of the experimental results using `nodeplotlib`.

## Prerequisites
To run this simulation, you must have the following installed:
* [Node.js](https://nodejs.org/) (Version 18.x or higher recommended)
* npm (Node Package Manager)

## Installation
1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/rasyidrizky/bls12-381-signature-experiment.git](https://github.com/rasyidrizky/bls12-381-signature-experiment.git)
   cd bls12-381-signature-experiment
2. Install the required cryptographic and visualization dependencies:
   ```bash
   npm install
## Usage
1. Run the benchmarking script directly via Node.js:
   ```bash
   node index.js
## Project Structure
* **index.js** - The core benchmarking script containing the BLS evaluator class, warm-up phases, and execution loops.
* **utils.js** - Helper functions including the real-time terminal progress tracker and hex-to-byte converters.

## Author
<table align="center" style="border-collapse: collapse; border: none;">
  <tr style="border: none;">
    <td align="center" style="border: none;">
      <img src="./avatar.png" alt="Profile" width="120" style="border-radius: 8px;" />
      <br /><br />
      <a href="https://github.com/rasyidrizky" style="font-size: 18px; font-weight: bold; text-decoration: none;">Rasyid Rizky Susilo N.</a>
      <br />
      <a href="https://github.com/rasyidrizky" style="font-size: 16px; text-decoration: none;">18223114</a>
    </td>
  </tr>
</table>