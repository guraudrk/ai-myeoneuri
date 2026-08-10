import { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, StatusBar, Modal, TextInput, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { getFavorites, addFavorite, removeFavorite, type FavoriteContact } from "@/features/favorites/FavoritesAdapter";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { dialContact } from "@/services/contactCallService";
import { addLog } from "@/features/conversation-log/ConversationLogService";
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, TouchSize } from "@/components/tokens";
import type { ContactCandidate } from "@/domain/types";

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter = createRealPhoneAdapter();
let reqCounter = 0;
function nextReqId() { return `fav-${++reqCounter}-${Date.now()}`; }

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactCandidate[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!showAdd) return;
    let cancelled = false;
    setSearching(true);
    contactsAdapter.searchContacts(query).then((r) => {
      if (!cancelled) { setResults(r.slice(0, 40)); setSearching(false); }
    }).catch(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [query, showAdd]);

  async function load() { setFavorites(await getFavorites()); }

  async function handleCall(fav: FavoriteContact) {
    const r = await dialContact(nextReqId(), fav.id, fav.name, contactsAdapter, phoneAdapter);
    if (r.status === "dialer_opened") {
      await addLog("📞", `${r.contactName} 님께 전화`);
    } else {
      Alert.alert("전화 오류", "전화번호를 찾을 수 없어요.");
    }
  }

  function handleRemove(fav: FavoriteContact) {
    Alert.alert("삭제", `${fav.name} 님을 즐겨찾기에서 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
        await removeFavorite(fav.id);
        load();
      }},
    ]);
  }

  async function handleAdd(c: ContactCandidate) {
    await addFavorite({ id: c.id, name: c.name });
    await load();
    setShowAdd(false);
    setQuery("");
  }

  const initial = (n: string) => n.trim()[0] ?? "?";

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.headerSide} onPress={() => router.back()}>
          <Text style={s.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>즐겨찾기</Text>
        <TouchableOpacity style={[s.headerSide, s.headerRight]} onPress={() => setShowAdd(true)}>
          <Text style={s.addText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(f) => f.id}
        contentContainerStyle={[s.list, favorites.length === 0 && s.listCenter]}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>👨‍👩‍👧</Text>
            <Text style={s.emptyTitle}>즐겨찾기가 없어요</Text>
            <Text style={s.emptySub}>가족을 추가하면 말 한마디로{"\n"}바로 연락할 수 있어요</Text>
            <TouchableOpacity style={[s.ctaBtn, Shadow.button]} onPress={() => setShowAdd(true)}>
              <Text style={s.ctaBtnText}>가족 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.row, Shadow.card]}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial(item.name)}</Text>
            </View>
            <Text style={s.name} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity style={s.callBtn} onPress={() => handleCall(item)}>
              <Text style={s.callBtnText}>📞 전화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.delBtn} onPress={() => handleRemove(item)}>
              <Text style={s.delBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* 연락처 검색 모달 */}
      <Modal
        visible={showAdd}
        animationType="slide"
        onRequestClose={() => { setShowAdd(false); setQuery(""); }}
      >
        <View style={s.root}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
          <View style={s.header}>
            <TouchableOpacity style={s.headerSide} onPress={() => { setShowAdd(false); setQuery(""); }}>
              <Text style={s.backText}>취소</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>연락처 검색</Text>
            <View style={s.headerSide} />
          </View>
          <View style={s.searchBar}>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="이름 검색"
              placeholderTextColor={Colors.placeholder}
              autoFocus
            />
          </View>
          {searching ? (
            <ActivityIndicator style={s.spinner} color={Colors.primary} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(c) => c.id}
              contentContainerStyle={s.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.row, Shadow.card]} onPress={() => handleAdd(item)}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initial(item.name)}</Text>
                  </View>
                  <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.addHint}>+ 추가</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSide:  { minWidth: 64 },
  headerRight: { alignItems: "flex-end" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: FontFamily.heading,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: "600", fontFamily: FontFamily.body },
  addText:  { fontSize: 15, color: Colors.primary, fontWeight: "600", fontFamily: FontFamily.body },

  list:       { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40 },
  listCenter: { flex: 1 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 12,
  },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 22, color: "#FFF", fontWeight: "700" },
  name:       { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary, fontFamily: FontFamily.body },

  callBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: "center" },
  callBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700", fontFamily: FontFamily.body },

  delBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  delBtnText: { fontSize: 20, color: Colors.textMuted },

  addHint: { fontSize: 14, color: Colors.primary, fontWeight: "600", fontFamily: FontFamily.body },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.heading, fontWeight: "700", color: Colors.textPrimary, fontFamily: FontFamily.heading },
  emptySub:   { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: "center", lineHeight: 24, fontFamily: FontFamily.bodyRegular },

  ctaBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  ctaBtnText: { color: "#FFF", fontSize: FontSize.body, fontWeight: "700", fontFamily: FontFamily.headingMedium },

  searchBar:   { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontFamily: FontFamily.body,
    minHeight: TouchSize.minimum,
  },
  spinner: { marginTop: 48 },
});
