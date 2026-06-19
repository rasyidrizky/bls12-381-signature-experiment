import * as bls from '@noble/bls12-381';
import { performance } from 'perf_hooks';
import { plot } from 'nodeplotlib';
import os from 'os';

import { hexToUint8Array, yieldEventLoop, Tracker } from './utils.js';

const hexString = "8a2b5c7d9e1f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b";

class BLSEvaluator {
    constructor() {
        this.validatorScales = [10, 50, 100, 250, 500, 1000];
        this.iterations = 50;
        this.warmUpIterations = 20;
        this.message = hexToUint8Array(hexString);
        this.results = [];
        this.tracker = new Tracker();
    }

    normalizeSamples(samples) {
        if (samples.length < 20) {
            return samples.reduce((a, b) => a + b, 0) / samples.length;
        }

        const sorted = [...samples].sort((a, b) => a - b);
        const trimCount = Math.floor(sorted.length * 0.05);
        const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

        return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    async performWarmUp() {
        console.log(`\n[1/3] Executing warm-up phase...`);

        const dummyPrivateKey = bls.utils.randomPrivateKey();
        const dummyPublicKey = bls.getPublicKey(dummyPrivateKey);
        const dummySignature = await bls.sign(this.message, dummyPrivateKey);

        this.tracker.start(this.warmUpIterations, "Warm-up Process    ");

        for (let i = 0; i < this.warmUpIterations; i++) {
            await bls.verify(dummySignature, this.message, dummyPublicKey);
            bls.aggregatePublicKeys([dummyPublicKey, dummyPublicKey]);
            bls.aggregateSignatures([dummySignature, dummySignature]);

            await yieldEventLoop();
            this.tracker.update(i + 1);
        }

        this.tracker.stop();
        console.log("Warm-up phase completed.");
    }

    async runBenchmarks() {
        console.log("\n[2/3] Initiating experimental benchmarks...");

        for (const N of this.validatorScales) {
            const linearSamples = [];
            const aggregationSamples = [];
            const aggregateVerifySamples = [];

            const privateKeys = Array.from(
                { length: N },
                () => bls.utils.randomPrivateKey()
            );

            const publicKeys = privateKeys.map(sk =>
                bls.getPublicKey(sk)
            );

            const signatures = await Promise.all(
                privateKeys.map(sk =>
                    bls.sign(this.message, sk)
                )
            );

            const signatureSize = signatures[0].length;
            const publicKeySize = publicKeys[0].length;

            const aggregatedKey = bls.aggregatePublicKeys(publicKeys);
            const aggregatedSignature = bls.aggregateSignatures(signatures);

            const linearPayloadSize = (signatureSize + publicKeySize) * N;

            const aggregatedPayloadSize = aggregatedSignature.length + aggregatedKey.length;

            const label = `Simulating N = ${N.toString().padEnd(4)}`;
            this.tracker.start(this.iterations, label);

            for (let i = 0; i < this.iterations; i++) {
                // Scenario A: Individual Verification
                const startLinear = performance.now();
                for (let j = 0; j < N; j++) {
                    await bls.verify(signatures[j], this.message, publicKeys[j]);
                }
                const endLinear = performance.now();
                linearSamples.push(endLinear - startLinear);

                await yieldEventLoop();

                // Scenario B: Aggregated Verification
                const startAggregation = performance.now();
                const aggregatedKey = bls.aggregatePublicKeys(publicKeys);
                const aggregatedSignature = bls.aggregateSignatures(signatures);
                const endAggregation = performance.now();
                aggregationSamples.push(endAggregation - startAggregation);

                const startAggregateVerify = performance.now();
                await bls.verify(aggregatedSignature, this.message, aggregatedKey);
                const endAggregateVerify = performance.now();
                aggregateVerifySamples.push(endAggregateVerify - startAggregateVerify);

                this.tracker.update(i + 1);
                await yieldEventLoop();
            }

            this.tracker.stop();

            const avgLinearTime = this.normalizeSamples(linearSamples);
            const avgAggregationTime = this.normalizeSamples(aggregationSamples);
            const avgAggregateVerifyTime = this.normalizeSamples(aggregateVerifySamples);
            const avgTotalAggregatedRoute = avgAggregationTime + avgAggregateVerifyTime;

            this.results.push({
                "Validator Scale (N)": N,
                "Individual Verification Time (ms)": parseFloat(avgLinearTime.toFixed(4)),
                "Aggregation Time (ms)": parseFloat(avgAggregationTime.toFixed(4)),
                "Aggregated Verification (ms)": parseFloat(avgAggregateVerifyTime.toFixed(4)),
                "Total Aggregated Route (ms)": parseFloat(avgTotalAggregatedRoute.toFixed(4)),
                "Linear Payload (bytes)": linearPayloadSize,
                "Aggregated Payload (bytes)": aggregatedPayloadSize
            });
        }

        console.log("\n[3/3] Benchmarks completed successfully.");
        const terminalDisplay = this.results.map(r => ({
            "N": r["Validator Scale (N)"],
            "Linear (ms)": r["Individual Verification Time (ms)"],
            "Agg Time (ms)": r["Aggregation Time (ms)"],
            "Agg Verify (ms)": r["Aggregated Verification (ms)"],
            "Total Agg (ms)": r["Total Aggregated Route (ms)"],
            "Linear Payload (Bytes)": r["Linear Payload (bytes)"],
            "Agg Payload (Bytes)": r["Aggregated Payload (bytes)"]
        }));

        console.table(terminalDisplay);
    }

    generateVisualizations() {
        console.log("\nGenerating visualization...");

        const xValues = this.results.map(r => String(r["Validator Scale (N)"]));
        const exportConfig = {
            displayModeBar: true,
            toImageButtonOptions: {
                format: 'png',
                filename: 'BLS12-381_Benchmark',
                height: 800,
                width: 1200,
                scale: 2
            }
        };

        // Time Comparison Chart
        const lineTraces = [
            {
                x: xValues,
                y: this.results.map(r => r["Individual Verification Time (ms)"]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Individual Verification'
            },
            {
                x: xValues,
                y: this.results.map(r => r["Total Aggregated Route (ms)"]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Total Aggregated Route'
            },
            {
                x: xValues,
                y: this.results.map(r => r["Aggregated Verification (ms)"]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Aggregated Verification'
            }
        ];

        const lineLayout = {
            title: '<b>Computational Time Evaluation</b><br>BLS12-381 Individual vs Aggregated Verification',
            xaxis: { title: 'Validator Scale (N)' },
            yaxis: { title: 'Execution Time (Milliseconds)' }
        };

        // Storage Comparison Chart
        const barTraces = [
            {
                x: xValues,
                y: this.results.map(r => r["Linear Payload (bytes)"]),
                type: 'bar',
                name: 'Unaggregated Signatures'
            },
            {
                x: xValues,
                y: this.results.map(r => r["Aggregated Payload (bytes)"]),
                type: 'bar',
                name: 'Aggregated Signature'
            }
        ];

        const barLayout = {
            title: '<b>Storage Efficiency Evaluation</b><br>Signature Size Comparison',
            xaxis: { title: 'Validator Scale (N)' },
            yaxis: { title: 'Size (Bytes)' },
            barmode: 'group'
        };

        plot(lineTraces, lineLayout, exportConfig);
        plot(barTraces, barLayout, exportConfig);
    }

    async execute() {
        console.log("Starting BLS12-381 Signature Aggregation Benchmark...");

        const ramGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        console.log("Environment:");
        console.log(`CPU      : ${os.cpus()[0].model}`);
        console.log(`Cores    : ${os.cpus().length}`);
        console.log(`RAM      : ${ramGB} GB`);
        console.log(`Platform : ${os.platform()}`);

        await this.performWarmUp();
        await this.runBenchmarks();
        this.generateVisualizations();
    }
}

const experiment = new BLSEvaluator();
experiment.execute().catch(console.error);