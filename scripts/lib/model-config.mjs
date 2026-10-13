export function normalizeModelConfig(manifest, config, observedAt, sourceUrl, revision = null) {
  const layers = Number(config.num_hidden_layers ?? config.n_layer ?? manifest.layers);
  const attentionHeads = Number(config.num_attention_heads ?? config.n_head ?? 0);
  const kvHeads = Number(config.num_key_value_heads ?? (attentionHeads || manifest.kvHeads));
  const hiddenSize = Number(config.hidden_size ?? config.n_embd ?? 0);
  const headDimension = Number(config.head_dim ?? ((attentionHeads ? hiddenSize / attentionHeads : 0) || manifest.headDimension));
  const nativeContext = Number(config.max_position_embeddings ?? config.n_positions ?? config.seq_length ?? manifest.nativeContext);

  for (const [key, value] of Object.entries({ layers, kvHeads, headDimension, nativeContext })) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${manifest.slug}: invalid ${key}`);
  }

  const kvGiBPer1kTokens = (2 * layers * kvHeads * headDimension * 2 * 1000) / (2 ** 30);
  return {
    slug: manifest.slug,
    modelId: manifest.modelId,
    nativeContext,
    layers,
    kvHeads,
    headDimension,
    kvGiBPer1kTokens: Number(kvGiBPer1kTokens.toFixed(6)),
    sourceUrl,
    observedAt,
    revision,
    status: "verified",
  };
}

export async function collectModelConfig(manifest, fetchImpl = fetch) {
  const sourceUrl = `https://huggingface.co/${manifest.modelId}/resolve/main/config.json`;
  const response = await fetchImpl(sourceUrl, {
    headers: { "user-agent": "ModelFitDataBot/1.0 (+https://modelfit.cc/methodology)" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${manifest.modelId}: HTTP ${response.status}`);
  const revision = response.url.match(/\/resolve-cache\/models\/[^/]+\/[^/]+\/([a-f0-9]{40})\//)?.[1] ?? null;
  return normalizeModelConfig(manifest, await response.json(), new Date().toISOString(), sourceUrl, revision);
}
