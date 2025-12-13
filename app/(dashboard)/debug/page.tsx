
"use client";

import { useEffect, useState } from "react";
import Mermaid from "@/components/Mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function DebugPage() {
    const [graphData, setGraphData] = useState<any>(null);
    const [mermaidChart, setMermaidChart] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Helper to convert spelunker tree to mermaid
    const convertToMermaid = (input: any): string => {
        if (!input) return "graph TD;\nError[No Data]";
        const modules = Array.isArray(input) ? input : [input];

        // We'll build the mermaid string in parts
        let mermaidStr = "graph TD;\n";

        // 1. Define nodes and subgraphs
        modules.forEach((mod: any) => {
            const moduleName = mod.name || "UnknownModule";
            const safeModuleName = moduleName.replace(/[\s\(\)]/g, '_');

            mermaidStr += `subgraph ${safeModuleName} [${moduleName}]\n`;
            mermaidStr += `  direction TB\n`;

            // Defines the Module itself as a node strictly if we want to show module-level links easily,
            // or just rely on the subgraph. 
            // Often it's nice to have a node representing the module entry point.
            // Let's create a node for the module usage.
            mermaidStr += `  ${safeModuleName}_Node[${moduleName}]\n`; // explicit module node

            // Providers
            if (mod.providers) {
                Object.entries(mod.providers).forEach(([providerName, providerDetails]: [string, any]) => {
                    const safeProviderName = providerName.replace(/[\s\(\)]/g, '__');
                    const uniqueId = `${safeModuleName}__${safeProviderName}`;
                    mermaidStr += `  ${uniqueId}(["${providerName}"])\n`;
                });
            }
            mermaidStr += "end\n";
        });

        // 2. Define Edges
        modules.forEach((mod: any) => {
            const moduleName = mod.name || "UnknownModule";
            const safeModuleName = moduleName.replace(/[\s\(\)]/g, '_');

            // Module Imports
            // mod.imports is array of strings (names of imported modules)
            const imports = mod.imports || mod.module?.imports || [];
            imports.forEach((imp: string | any) => {
                const impName = typeof imp === 'string' ? imp : imp.name;
                const safeImpName = impName.replace(/[\s\(\)]/g, '_');
                // Link Module Node -> Imported Module Node
                mermaidStr += `${safeModuleName}_Node --> ${safeImpName}_Node\n`;
            });

            // Provider Injections
            if (mod.providers) {
                Object.entries(mod.providers).forEach(([providerName, providerDetails]: [string, any]) => {
                    const safeProviderName = providerName.replace(/[\s\(\)]/g, '__');
                    const uniqueId = `${safeModuleName}__${safeProviderName}`;

                    if (providerDetails.injections && Array.isArray(providerDetails.injections)) {
                        providerDetails.injections.forEach((dep: string) => {
                            if (!dep) return; // Skip unknown/null

                            const safeDepName = dep.replace(/[\s\(\)]/g, '__');
                            // We need to find which module the dependency belongs to for a precise link,
                            // OR we can just link to ANY node with that provider name ID.
                            // Since we prefixed IDs with module name (${safeModuleName}__${safeProviderName}), 
                            // we can't link directly unless we search.

                            // Strategy: Just create a "loose" node for the dependency if we can't find it?
                            // Or, sophisticated matching.
                            // Simple approach: Check all modules for this provider.
                            let targetId = '';

                            for (const otherMod of modules) {
                                if (otherMod.providers && otherMod.providers[dep]) {
                                    const otherModSafe = otherMod.name.replace(/[\s\(\)]/g, '_');
                                    targetId = `${otherModSafe}__${safeDepName}`;
                                    break;
                                }
                            }

                            if (targetId) {
                                mermaidStr += `${uniqueId} -.-> ${targetId}\n`;
                            } else {
                                // External or not found in inspected tree (e.g. core Nest provider)
                                // Create a node outside? or just text?
                                // Let's make an external node
                                const fallbackId = `External__${safeDepName}`;
                                mermaidStr += `${uniqueId} -.-> ${fallbackId}[${dep}]\n`;
                            }
                        });
                    }

                    // Also link Module Node to its Providers to show ownership visually? 
                    // No, invalid usage of subgraph (can't link subgraph to node easily in old versions).
                    // But we used a ${safeModuleName}_Node inside the subgraph. 
                    // Let's link ModuleNode -> Providers to represent "exports/provides"
                    mermaidStr += `${safeModuleName}_Node --- ${uniqueId}\n`;
                });
            }
        });

        return mermaidStr;
    };

    useEffect(() => {
        // Determine API URL. Assuming bot runs on port 80 or similar,
        // and admin on 3000. We might need a relative path if proxied, 
        // or absolute if running locally.
        // For local dev, maybe localhost:80 needs a proxy or direct access.
        // Let's try direct fetch to port 80 (standard HTTP) or default.
        // BUT we are in Browser. We need the public URL of the bot.
        // If running locally, http://localhost:80/debug/graph
        // If remote, it depends.
        // Let's try '/api/debug/graph' if we had a proxy, but we don't know the proxy setup.
        // We'll try a hardcoded localhost:80 for now or use ENV.

        // Better: Allow user to input URL or try default.
        const fetchGraph = async () => {
            try {
                const res = await fetch("/admin/api/debug/graph"); // Relative path handled by NextJS proxy
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setGraphData(data);
                setMermaidChart(convertToMermaid(data));
            } catch (e) {
                console.error(e);
                setMermaidChart("graph TD;\nError[Failed to fetch graph]");
            } finally {
                setLoading(false);
            }
        };

        fetchGraph();
    }, []);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">System Debug</h2>
            </div>
            <Card className="h-[80vh] flex flex-col">
                <CardHeader>
                    <CardTitle>Dependency Graph</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden relative p-0">
                    {loading ? (
                        <div className="p-4">Loading dependency graph...</div>
                    ) : (
                        <TransformWrapper
                            initialScale={2}
                            minScale={0.1}
                            maxScale={50}
                            centerOnInit
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/80 p-2 rounded-md border shadow-sm backdrop-blur-sm">
                                        <button onClick={() => zoomIn()} className="px-2 py-1 text-sm border rounded hover:bg-muted font-bold" title="Zoom In">+</button>
                                        <button onClick={() => zoomOut()} className="px-2 py-1 text-sm border rounded hover:bg-muted font-bold" title="Zoom Out">-</button>
                                        <button onClick={() => resetTransform()} className="px-2 py-1 text-sm border rounded hover:bg-muted" title="Reset">Reset</button>
                                    </div>
                                    <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                                        <div className="w-full h-full min-h-[600px] min-w-[800px] flex items-center justify-center p-8 bg-white">
                                            <Mermaid chart={mermaidChart} />
                                        </div>
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    )}
                </CardContent>
            </Card>

            {graphData && (
                <div className="mt-4">
                    <details>
                        <summary className="cursor-pointer text-sm text-muted-foreground">Raw JSON</summary>
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-96">
                            {JSON.stringify(graphData, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
