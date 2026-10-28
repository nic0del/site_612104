// The test page uses the existing account, with a separate JSON save slot.
// Production scene_text, player_state fields and updated_at are preserved.
const SLOT = "preview_chapter2_v2";

export function createPreviewSaveStore(client) {
  async function readRow(owner) {
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!owner || auth?.user?.id !== owner) throw new Error("La session du compte a changé.");
    const { data, error } = await client.from("saves").select("*")
      .eq("user_id", owner).maybeSingle();
    if (error) throw error;
    return data;
  }

  return {
    async read(owner) {
      const row = await readRow(owner);
      const preview = row?.player_state?.[SLOT];
      if (!preview || typeof preview !== "object" || Array.isArray(preview)) return null;
      const scene = preview.currentChapter === "chapter2" ? preview.scene2 : preview.scene1;
      return { player_state: preview, scene_text: scene?.currentNodeId || "new_game",
        updated_at: preview.savedAt };
    },
    async write(snapshot, owner) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const row = await readRow(owner);
        if (!row) {
          // Insert cannot overwrite a production save created concurrently.
          const { error } = await client.from("saves").insert({
            user_id: owner, scene_text: "new_game",
            player_state: { [SLOT]: snapshot },
            updated_at: new Date().toISOString()
          });
          if (error) throw error;
          return;
        }
        const current = row.player_state;
        if (current != null && (typeof current !== "object" || Array.isArray(current))) {
          throw new Error("Format de sauvegarde incompatible. La partie habituelle a été conservée.");
        }
        // If production advanced after our read, retry against its newer row.
        const { data, error } = await client.from("saves")
          .update({ player_state: { ...current, [SLOT]: snapshot } })
          .eq("user_id", owner).eq("updated_at", row.updated_at)
          .select("user_id").maybeSingle();
        if (error) throw error;
        if (data) return;
      }
      throw new Error("La partie habituelle a changé. Réessaie la synchronisation du test.");
    }
  };
}
