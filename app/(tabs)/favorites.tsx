import { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, StatusBar, Modal, TextInput, ActivityIndicator,
} from "react-native";
import { getFavorites, addFavorite, removeFavorite, type FavoriteContact } from "@/features/favorites/FavoritesAdapter";
import { createRealContactsAdapter } from "@/features/contacts/RealContactsAdapter";
import { createRealPhoneAdapter } from "@/features/calling/RealPhoneAdapter";
import { dialContact } from "@/services/contactCallService";
import { addLog } from "@/features/conversation-log/ConversationLogService";
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, TouchSize } from "@/components/tokens";
import type { ContactCandidate } from "@/domain/types";

const contactsAdapter = createRealContactsAdapter();
const phoneAdapter    = createRealPhoneAdapter();
let reqCounter = 0;
function nextReqId() { return `fav-${++reqCounter}-${Date.now()}`; }

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteContact[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<ContactCandidate[]>([]);
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
    Alert.alert(
      "가족 추가",
      `${c.name} 님을 즐겨찾기에 추가할까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "추가할게요", onPress: async () => {
          await addFavorite({ id: c.id, name: c.name });
          await load();
          setShowAdd(false);
          setQuery("");
        }},
      ]
    );
  }

  const initial = (n: string) => n.trim()[0] ?? "?";

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>즐겨찾기</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} accessibilityLabel="연락처 추가">
          <Text style={s.addBtnText}>+ 추가</Text>
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
            <TouchableOpacity style={s.callBtn} onPress={() => handleCall(item)} accessibilityLabel={`${item.name} 전화`}>
              <Text style={s.callBtnText}>📞 전화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.delBtn} onPress={() => handleRemove(item)} accessibilityLabel={`${item.name} 삭제`}>
              <Text style={s.delBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        visible={showAdd}
        animationType="slide"
        onRequestClose={() => { setShowAdd(false); setQuery(""); }}
      >
        <View style={s.root}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
          <View style={s.header}>
            <Text style={s.headerTitle}>연락처 검색</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => { setShowAdd(false); setQuery(""); }}>
              <Text style={s.addBtnText}>닫기</Text>
            </TouchableOpacity>
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
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: FontFamily.heading,
  },
  addBtn:     { minHeight: TouchSize.minimum, justifyContent: "center", paddingHorizontal: 4 },
  addBtnText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: "600", fontFamily: FontFamily.body },

  list:       { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40 },
  listCenter: { flex: 1 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 12,
    minHeight: TouchSize.minimum,
  },
  avatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: FontSize.body, color: "#FFF", fontWeight: "700" },
  name:       { flex: 1, fontSize: FontSize.body, fontWeight: "600", color: Colors.textPrimary, fontFamily: FontFamily.body },

  callBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 10, paddingHorizontal: 16, minHeight: 44, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  callBtnText: { color: "#FFF", fontSize: FontSize.caption, fontWeight: "700" },

  delBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  delBtnText: { fontSize: 22, color: Colors.textMuted },

  addHint: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: "600" },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.heading, fontWeight: "700", color: Colors.textPrimary, fontFamily: FontFamily.heading },
  emptySub:   { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: "center", lineHeight: 28, fontFamily: FontFamily.body },

  ctaBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, paddingHorizontal: 28, marginTop: 8, minHeight: TouchSize.minimum, justifyContent: "center" },
  ctaBtnText: { color: "#FFF", fontSize: FontSize.body, fontWeight: "700", fontFamily: FontFamily.headingMedium },

  searchBar:   { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontFamily: FontFamily.body,
    minHeight: TouchSize.minimum,
  },
  spinner: { marginTop: 48 },
});
