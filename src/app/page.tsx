'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, Globe, LogIn, LogOut,
  ShieldCheck, Lock, Receipt, KeyRound, CheckCircle2, ChevronRight,
  ArrowRight, ArrowLeft, Plus, Clock, Plane, CreditCard, X, AlertCircle,
  MessageSquare, Send, Upload, Sparkles, User, Award, Camera, HelpCircle
} from 'lucide-react';

import { getProviders, signIn, signOut } from 'next-auth/react';

type Lang = 'ko' | 'en';
type View = 'landing' | 'browse' | 'create' | 'trade' | 'profile';

interface ChatMessage {
  createdAt?: string;
  id?: string;
  sender: 'BUYER' | 'TRAVELER' | 'SYSTEM';
  name: string;
  text: string;
  time: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  avatarUrl: string;
  level: string;
  payoutBank: string;
  payoutAccount: string;
  completedDeliveries: number;
  totalOrders: number;
}

interface Order {
  id: string;
  titleKo: string;
  titleEn: string;
  originKo: string;
  originEn: string;
  originFlag: string;
  destKo: string;
  destEn: string;
  priceKrw: number;
  rewardKrw: number;
  imageUrl: string;
  categoryKo: string;
  categoryEn: string;
  storeKo: string;
  storeEn: string;
  status: string;
  quantity: number;
  options: string;
  wantedDate: string;
  role?: 'BUYER' | 'TRAVELER' | 'VISITOR';
  offers?: { id: string; travelerName: string; rewardKrw: number; arrivalDate: string; status: string }[];
  deliveryPin: string;
  travelerName?: string;
  travelerRating?: string;
  travelerAvatar?: string;
  arrivalDate?: string;
  receiptUrl?: string;
  chatMessages: ChatMessage[];
}

const DICT = {
  ko: {
    navOrder: '물품 주문하기',
    navBrowse: '주문 둘러보기',
    navHow: '이용방법',
    badgeTrusted: '안전한 글로벌 핸드캐리 플랫폼',
    heroTitle: '해외 한정판 및 전 세계 상품,',
    heroTitleSub: '여행자의 캐리어로 가장 빠르게 직송',
    heroDesc: '현지 매장이나 해외 온라인 몰에서 사고 싶은 물품을 요청하세요. 여행자가 직접 구매 후 입국하여 전달하며, 물품 검수가 완료될 때까지 결제 대금은 안전 금고에 보관됩니다.',
    btnOrderHero: '물품 주문하기 (Order an item)',
    btnTripHero: '주문 둘러보기 & 수고비 확인',
    trustEscrow: '결제 내역 확인',
    trustReceipt: '현지 매장 실물 영수증 검증',
    trustPin: '대면 수령 4자리 PIN 정산',
    
    // 이용방법 (How It Works) 공식 가이드
    howTitle: '이용방법 (How It Works)',
    howSub: '해외 물품 구매자와 여행자 모두를 위한 4단계 핵심 프로세스',
    howTabShopper: '해외 물품 주문 (Shopper)',
    howTabTraveler: '여행자 배송 & 수익 (Traveler)',
    
    step1Shop: '1. 주문 요청 등록',
    step1ShopDesc: '해외 온라인 몰 링크나 상품명, 현지 매장 정보를 입력하고 희망하는 여행자 수고비를 설정합니다.',
    step2Shop: '2. 전달 제안 수락',
    step2ShopDesc: '해당 도시를 방문하는 여행자들의 귀국 일정과 배송 제안을 확인하고 가장 마음에 드는 제안을 채택합니다.',
    step3Shop: '3. 에스크로 결제 (대금 락)',
    step3ShopDesc: '결제 대금은 여행자에게 바로 가지 않고 플랫폼 안전 금고에 보관됩니다. 거래별 결제 내역을 확인할 수 있습니다.',
    step4Shop: '4. 실물 검수 후 PIN 전달',
    step4ShopDesc: '여행자를 직접 만나 실물과 공식 영수증을 확인한 후 본인의 4자리 PIN을 전달하면 최종 정산이 완료됩니다.',

    step1Travel: '1. 여행 경로 주문 탐색',
    step1TravelDesc: '본인의 출국/귀국 도시(도쿄, 오사카, 방콕 등)와 일치하며 캐리어 여유 공간에 들어가는 주문을 선택합니다.',
    step2Travel: '2. 전달 제안 제출',
    step2TravelDesc: '귀국 예정일과 희망 배송 수고비를 입력하여 주문자에게 전달 제안을 전송합니다.',
    step3Travel: '3. 현지 매장 직접 구매',
    step3TravelDesc: '제안이 수락되면 본인 자금으로 매장에서 정품을 직접 구매하고 공식 영수증 사진을 등록합니다.',
    step4Travel: '4. 물품 전달 및 정산 환급',
    step4TravelDesc: '주문자를 만나 물품을 전달하고 4자리 PIN을 입력받으면, 상품 원가와 수고비가 즉시 계좌로 정산 지급됩니다.',

    // 보안 및 신뢰
    safetyHeading: '거래 안전 보장 체계',
    safety1Title: '에스크로 자금 보관 (Escrow Vault)',
    safety1Desc: '주문자가 물품을 확인하고 PIN을 승인하기 전까지 여행자에게 대금이 절대 지급되지 않습니다.',
    safety2Title: '실물 영수증 증빙 (Official Receipt)',
    safety2Desc: '구매 내역을 확인할 수 있도록 공식 매장 영수증 원본 사진을 등록합니다.',
    safety3Title: '보안 PIN 핸드셰이크 (Security PIN)',
    safety3Desc: '물품을 실물로 인수한 주문자만이 보유한 고유 PIN 번호가 입력되어야 최종 정산이 해제됩니다.',

    recentOrdersTitle: '실시간 등록 주문 목록',
    recentOrdersSub: '여행 경로와 일치하는 주문을 확인하고 전달 제안을 보내보세요.',
    viewAll: '전체 보기',
    rewardLabel: '여행자 수고비',
    btnMakeOffer: '전달 제안하기',
    btnViewRoom: '거래실 입장',
    createTitle: '어떤 물품을 구매하고 싶으신가요?',
    createSub: '해외 매장이나 온라인 몰 정보를 입력하면 여행자가 제안을 보내드립니다.',
    itemNameLabel: '상품명 (정확한 품명) *',
    itemPlaceHolder: '예: 요시다 포터 탱커 백팩 블랙',
    storeLocationLabel: '구매 국가 / 도시 *',
    priceLabel: '현지 예상 원가 (KRW) *',
    rewardInputLabel: '희망 여행자 수고비 (KRW) *',
    imgUrlLabel: '상품 이미지 URL (선택)',
    estBoxTitle: '예상 결제 예치금 (에스크로 보관)',
    itemPriceText: '상품 원가',
    platformFeeText: '안전 에스크로 보증 수수료 (8%)',
    totalDepositText: '총 결제 예치금액',
    btnPublishOrder: '주문 요청 등록하기',
    browseTitle: '주문 둘러보기 (Grab orders)',
    browseSub: '내 여행 경로에 있는 주문을 확인하고 배송 수고비를 받으세요.',
    postRequestBtn: '주문 직접 등록',
    backBtn: '뒤로가기',
    reportIssueBtn: '거래 문제 신고',
    progress1: '1. 주문 요청',
    progress2: '2. 전달 제안',
    progress3: '3. 에스크로 락',
    progress4: '4. 영수증 검증',
    progress5: '5. PIN 정산',
    travelerOfferCardTitle: '이 경로로 이동 예정이신가요?',
    travelerOfferCardSub: '귀국 예정일과 원하는 수고비로 전달 제안을 보내세요.',
    btnSendOfferDemo: '전달 제안 제출하기',
    offerReceivedTitle: '여행자 전달 제안 도착',
    arrivalLabel: '도착 예정일',
    btnAcceptEscrow: '제안 수락 및 에스크로 안전 결제',
    receiptWaitTitle: '현지 매장 실물 영수증 증빙 대기 중',
    receiptWaitDesc: '결제 대금이 에스크로에 안전하게 보관 중입니다. 출장자가 구매 후 영수증 사진을 올려야 합니다.',
    btnUploadReceiptDemo: '매장 영수증 사진 업로드',
    receiptVerifiedTitle: '현지 매장 영수증 등록 완료',
    receiptVerifiedDesc: '영수증이 증빙 보관되었습니다. 물품 전달 준비가 완료되었습니다.',
    chatTitle: '주문자 - 여행자 1:1 대화방',
    chatPlaceholder: '약속 장소나 일정을 조율하세요...',
    sendBtn: '전송',
    pinCardTitle: '구매자 인수 확인 PIN',
    pinCardDesc: '물품 실물과 영수증을 확인한 후 여행자에게 알려주세요. PIN을 입력해야 여행자에게 대금이 정산됩니다.',
    pinInputLabel: '전달받은 4자리 PIN 입력:',
    btnVerifyPin: 'PIN 확인 및 수령 확인',
    settledBadgeTitle: '✓ 수령 확인 완료',
    settledBadgeSub: '정산 처리 대기 중입니다.',
    authModalTitle: '로그인 또는 회원가입',
    authModalSub: '글로벌 핸드캐리 플랫폼 PopoCarry',
    kakaoBtn: 'Kakao로 계속하기',
    googleBtn: 'Google로 계속하기',
    orEmail: '또는 이메일로 시작하기',
    stripeModalTitle: '안심 에스크로 결제',
    stripeCardLabel: '카드 번호',
    stripeExpLabel: '만료일 (MM/YY)',
    stripeCvcLabel: 'CVC',
    stripeGuarantee: '실물 수령 후 PIN을 승인하기 전까지 결제 대금은 안전 금고에 안전하게 묶여 있습니다.',
    btnAuthorizePay: '에스크로 결제 승인하기',
    profileTitle: '내 계정',
    profileSub: '기본 정보와 수취 계좌를 관리하세요.',
    tabProfileInfo: '기본 정보',
    tabBankInfo: '수취 계좌',
    btnSaveProfile: '저장하기',
    nameLabel: '이름 / 닉네임',
    emailLabel: '이메일 주소',
    phoneLabel: '연락처',
    cityLabel: '활동 도시',
    bioLabel: '소개',
    bankNameLabel: '은행명',
    accountNumberLabel: '계좌번호',
    nationalityLabel: '국적',
    expiryDateLabel: '만료일',
    signInBtn: '로그인',
    signOutBtn: '로그아웃',
  },
  en: {
    navOrder: 'Order an item',
    navBrowse: 'Grab orders',
    navHow: 'How It Works',
    badgeTrusted: 'Global Hand-Carry Marketplace',
    heroTitle: 'Get Any Item Globally,',
    heroTitleSub: "Delivered in Traveler's Luggage",
    heroDesc: 'Request items unavailable or overpriced locally. Verified travelers buy directly from overseas stores and hand-carry them to your city with full escrow protection.',
    btnOrderHero: 'Order an item',
    btnTripHero: 'Browse Orders & Earn',
    trustEscrow: 'Payment Records',
    trustReceipt: 'Physical Store Receipt Verified',
    trustPin: '4-Digit Handshake PIN',
    
    // How It Works
    howTitle: 'How It Works',
    howSub: 'The 4-step workflow for both shoppers and travelers',
    howTabShopper: 'For Shoppers',
    howTabTraveler: 'For Travelers',

    step1Shop: '1. Create Order Request',
    step1ShopDesc: 'Paste the product link or enter details from any overseas store, and set your proposed traveler reward.',
    step2Shop: '2. Accept Delivery Offer',
    step2ShopDesc: 'Review offers from verified travelers heading to your city with matching arrival dates, and accept the best offer.',
    step3Shop: '3. Secure Escrow Payment',
    step3ShopDesc: 'Funds are held securely in platform escrow. The traveler is not paid until you inspect and receive the item.',
    step4Shop: '4. Inspect & Share PIN',
    step4ShopDesc: 'Meet the traveler, inspect your item and official store receipt, then share your 4-digit PIN to finalize payment.',

    step1Travel: '1. Find Requests Along Route',
    step1TravelDesc: 'Browse open delivery orders requested in your destination city that easily fit in your luggage.',
    step2Travel: '2. Make Delivery Offer',
    step2TravelDesc: 'Set your arrival date and requested delivery reward, and submit your offer to the shopper.',
    step3Travel: '3. Buy Item Locally',
    step3TravelDesc: 'Once the offer is accepted, buy the genuine item in person and upload the official store receipt photo.',
    step4Travel: '4. Deliver & Get Reimbursed',
    step4TravelDesc: 'Meet the shopper in person, enter their 4-digit delivery PIN, and receive item reimbursement plus reward.',

    safetyHeading: 'Trust & Safety Protocols',
    safety1Title: 'Escrow Vault Protection',
    safety1Desc: 'Shopper payments are locked in platform custody and cannot be claimed until the physical item is approved.',
    safety2Title: 'Store Receipt Verification',
    safety2Desc: 'Travelers must upload physical cash/card register receipts to guarantee product authenticity and pricing.',
    safety3Title: '4-Digit Handshake PIN',
    safety3Desc: 'Only the shopper holds the secret delivery PIN required to authorize final payout release to traveler.',

    recentOrdersTitle: 'Live Delivery Requests',
    recentOrdersSub: 'Pick up items along your journey and earn delivery fees.',
    viewAll: 'View All',
    rewardLabel: 'Traveler Reward',
    btnMakeOffer: 'Make Delivery Offer',
    btnViewRoom: 'View Trade Room',
    createTitle: 'What would you like to buy?',
    createSub: 'Enter foreign item details to receive traveler delivery offers.',
    itemNameLabel: 'Product Name or Title *',
    itemPlaceHolder: 'e.g. Porter Yoshida Tanker Backpack, Black',
    storeLocationLabel: 'Purchase Country / City *',
    priceLabel: 'Estimated Retail Price (KRW) *',
    rewardInputLabel: 'Proposed Traveler Reward (KRW) *',
    imgUrlLabel: 'Product Image URL (Optional)',
    estBoxTitle: 'Estimated Escrow Deposit',
    itemPriceText: 'Product Price',
    platformFeeText: 'Escrow Protection Fee (8%)',
    totalDepositText: 'Total Escrow Deposit',
    btnPublishOrder: 'Publish Order Request',
    browseTitle: 'Grab Orders',
    browseSub: 'Find requests matching your next flight and earn delivery fees.',
    postRequestBtn: 'Create Order',
    backBtn: 'Back',
    reportIssueBtn: 'Report Issue',
    progress1: '1. Order Requested',
    progress2: '2. Offer Made',
    progress3: '3. Escrow Locked',
    progress4: '4. Receipt Verified',
    progress5: '5. PIN Settled',
    travelerOfferCardTitle: 'Traveling this route?',
    travelerOfferCardSub: 'Submit an offer with your arrival date and requested fee.',
    btnSendOfferDemo: 'Submit Delivery Offer (Nov 05, ₩15,000)',
    offerReceivedTitle: 'Delivery Offer Received',
    arrivalLabel: 'Arrival',
    btnAcceptEscrow: 'Accept Offer & Authorize Escrow',
    receiptWaitTitle: 'Awaiting Physical Store Receipt',
    receiptWaitDesc: 'Funds are locked in escrow. Traveler must upload store register receipt.',
    btnUploadReceiptDemo: 'Upload Store Register Receipt',
    receiptVerifiedTitle: 'Physical Store Receipt Verified',
    receiptVerifiedDesc: 'Official receipt verified. Ready for hand-carry delivery.',
    chatTitle: 'Coordination Chat',
    chatPlaceholder: 'Coordinate meeting location and time...',
    sendBtn: 'Send',
    pinCardTitle: 'Buyer Delivery PIN',
    pinCardDesc: 'Share this PIN only after inspecting the item in person.',
    pinInputLabel: 'Enter PIN provided by buyer:',
    btnVerifyPin: 'Verify PIN & Release Payout',
    settledBadgeTitle: '✓ Delivery Confirmed',
    settledBadgeSub: 'Settlement pending.',
    authModalTitle: 'Sign In or Sign Up',
    authModalSub: 'Safe peer-to-peer delivery with complete escrow protection.',
    kakaoBtn: 'Continue with Kakao',
    googleBtn: 'Continue with Google',
    orEmail: 'Or continue with email',
    stripeModalTitle: 'Secure Escrow Checkout',
    stripeCardLabel: 'Card Number',
    stripeExpLabel: 'Expiration (MM/YY)',
    stripeCvcLabel: 'CVC',
    stripeGuarantee: 'Funds remain safely locked in escrow until you inspect the item and provide your PIN code.',
    btnAuthorizePay: 'Authorize Escrow Lock',
    profileTitle: 'My Account & Verification',
    profileSub: 'Manage your profile and payout account.',
    tabProfileInfo: 'Basic Profile',
    tabBankInfo: 'Payout Account',
    btnSaveProfile: 'Save Changes',
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    cityLabel: 'Base City',
    bioLabel: 'Bio',
    bankNameLabel: 'Bank Name',
    accountNumberLabel: 'Account Number',
    nationalityLabel: 'Nationality',
    expiryDateLabel: 'Expiry Date',
    signInBtn: 'Sign In',
    signOutBtn: 'Sign Out',
  }
};


const locations = [
    { country: { ko: '일본 · 도쿄', en: 'Japan · Tokyo' }, flag: '🇯🇵', store: { ko: '긴자 / 신주쿠 / 나리타공항', en: 'Ginza / Shinjuku / Narita Airport' } },
    { country: { ko: '일본 · 오사카', en: 'Japan · Osaka' }, flag: '🇯🇵', store: { ko: '우메다 / 도톤보리 / 간사이공항', en: 'Umeda / Dotonbori / Kansai Airport' } },
    { country: { ko: '태국 · 방콕', en: 'Thailand · Bangkok' }, flag: '🇹🇭', store: { ko: '시암 파라곤 / 수완나품', en: 'Siam Paragon / Suvarnabhumi' } },
    { country: { ko: '베트남 · 다낭', en: 'Vietnam · Da Nang' }, flag: '🇻🇳', store: { ko: '한시장 / 다낭국제공항', en: 'Han Market / Da Nang Airport' } },
    { country: { ko: '싱가포르', en: 'Singapore' }, flag: '🇸🇬', store: { ko: '오차드 로드 / 창이공항', en: 'Orchard Road / Changi Airport' } }
  ];

const AVATAR_PLACEHOLDER = '/avatar-placeholder.svg';
type ServerProfile = { id: string; name: string | null; email: string; phone?: string | null; city?: string | null; bio?: string | null; payoutBank?: string | null; payoutAccountMasked?: string; totalOrders?: number; completedDeliveries?: number };
type ServerOrder = Partial<Order> & { id: string; titleKo: string; chatMessages?: (ChatMessage & {createdAt?:string})[] };
async function apiRequest<T>(url:string, data?:unknown, form?:FormData):Promise<T> {
  const response=await fetch(url,{method:data!==undefined||form?'POST':'GET',headers:data!==undefined?{'Content-Type':'application/json'}:undefined,body:form||(data!==undefined?JSON.stringify(data):undefined),cache:'no-store'});
  const result=await response.json(); if(!response.ok||!result.success)throw new Error(result.error||'요청을 처리하지 못했습니다.');return result.data;
}
function mapOrder(o:ServerOrder):Order {
  return {...o,id:o.id,titleKo:o.titleKo,titleEn:o.titleEn||o.titleKo,originKo:o.originKo||'',originEn:o.originEn||o.originKo||'',originFlag:o.originFlag||'',destKo:o.destKo||'',destEn:o.destEn||o.destKo||'',priceKrw:o.priceKrw||0,rewardKrw:o.rewardKrw||0,imageUrl:o.imageUrl||'/product-placeholder.svg',categoryKo:o.categoryKo||'',categoryEn:o.categoryEn||o.categoryKo||'',storeKo:o.storeKo||'',storeEn:o.storeEn||o.storeKo||'',status:o.status||'PENDING',deliveryPin:o.deliveryPin||'',quantity:o.quantity||1,options:o.options||'',wantedDate:o.wantedDate||'',chatMessages:(o.chatMessages||[]).map(m=>({...m,time:m.createdAt?new Date(m.createdAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):m.time||''}))};
}

export default function PopoCarryPlatform() {
  const [lang, setLang] = useState<Lang>('ko');
  const [view, updateView] = useState<View>('landing');
  const [howTab, setHowTab] = useState<'shopper' | 'traveler'>('shopper');
  const [profileTab, setProfileTab] = useState<'basic' | 'bank'>('basic');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, updateSelectedId] = useState('');
  const selectedIdRef = useRef('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [orderTitle, setOrderTitle] = useState('');
  const [orderOriginIndex, setOrderOriginIndex] = useState(0);
  const [orderPrice, setOrderPrice] = useState(75000);
  const [orderReward, setOrderReward] = useState(20000);
  const [orderImg, setOrderImg] = useState('');
  const [orderDestination, setOrderDestination] = useState('서울 (ICN)');
  const [orderDate, setOrderDate] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderOptions, setOrderOptions] = useState('');
  const [orderUrl, setOrderUrl] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [offerReward, setOfferReward] = useState(15000);
  const [pinInput, setPinInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [historyEnd, setHistoryEnd] = useState(false);
  const chatBox = useRef<HTMLDivElement>(null);
  const followChat = useRef(true);
  const historyPosition = useRef<{ height: number; top: number } | null>(null);
  const visibleMessages = [...new Map([...olderMessages, ...(selectedOrder?.chatMessages || [])].map(m => [m.id, m])).values()];
  useEffect(() => { setOlderMessages([]); setHistoryEnd(false); setChatInput(''); followChat.current = true; historyPosition.current = null; }, [selectedOrderId]);
  useEffect(() => {
    const box = chatBox.current;
    if (!box) return;
    if (historyPosition.current) { box.scrollTop = historyPosition.current.top + box.scrollHeight - historyPosition.current.height; historyPosition.current = null; }
    else if (followChat.current) box.scrollTop = box.scrollHeight;
  }, [visibleMessages.length, visibleMessages[visibleMessages.length - 1]?.id]);

  const [toastMsg, setToastMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [showMine, setShowMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const t = DICT[lang];
  const showToast = (message: string) => { setToastMsg(message); };
  const formatPrice = (krw: number) => `₩ ${Math.round(krw).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}`;
  const setSelectedOrderId = (id: string) => { selectedIdRef.current = id; updateSelectedId(id); };
  const setView = (next: View) => {
    const query = new URLSearchParams();
    if (next !== 'landing') query.set('view', next);
    if (next === 'trade') query.set('order', selectedIdRef.current);
    history.pushState(null, '', query.size ? `/?${query}` : '/');
    updateView(next); setLoadError(''); setToastMsg(''); window.scrollTo(0, 0);
  };
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setToastMsg('');
    try { await action(); } catch (e) { showToast(e instanceof Error ? e.message : '요청을 처리하지 못했습니다.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const loadProfile = async () => {
    const p = await apiRequest<ServerProfile>('/api/profile');
    const next: UserProfile = { ...p, name: p.name || '', phone: p.phone || '', city: p.city || '', bio: p.bio || '', avatarUrl: AVATAR_PLACEHOLDER, level: lang === 'ko' ? '회원' : 'Member', payoutBank: p.payoutBank || '', payoutAccount: p.payoutAccountMasked || '', totalOrders: p.totalOrders || 0, completedDeliveries: p.completedDeliveries || 0 };
    setUser(next);
  };
  const loadTrade = async () => {
    const id = selectedIdRef.current;
    if (!id) return;
    const data = await apiRequest<ServerOrder>(`/api/orders/${encodeURIComponent(id)}`);
    if (selectedIdRef.current === id) setSelectedOrder(mapOrder(data));
  };
  useEffect(() => {
    const restoreAddress = () => {
      const params = new URLSearchParams(location.search), next = params.get('view');
      updateView(next && ['browse','create','trade','profile'].includes(next) ? next as View : next === 'mine' ? 'browse' : 'landing');
      setShowMine(next === 'mine');
      setSelectedOrderId(params.get('order') || '');
    };
    restoreAddress(); window.addEventListener('popstate', restoreAddress);
    const address = new URL(location.href);
    const authError = address.searchParams.get('authError');
    const english = localStorage.getItem('popocarry_lang') === 'en';
    const errors: Record<string, string> = english ? {
      email_missing: 'The provider did not share your email. Please check email consent settings.',
      email_unverified: 'Your provider email is not verified. Please verify it before signing up.',
      account_exists: 'An account already uses this email. Please sign in using your existing method. Social account linking is not yet available.',
    } : {
      email_missing: '소셜 로그인에서 이메일을 받지 못했습니다. 카카오 이메일 동의항목 설정과 사용자 동의 여부를 확인해 주세요.',
      email_unverified: '소셜 계정 이메일의 인증 여부를 확인할 수 없습니다. 해당 서비스에서 이메일 인증 후 다시 시도해 주세요.',
      account_exists: '같은 이메일로 가입한 회원이 있습니다. 기존 가입 방식으로 로그인해 주세요. 소셜 계정 연결 기능은 아직 지원하지 않습니다.',
    };
    if (authError && errors[authError]) {
      showToast(errors[authError]);
      address.searchParams.delete('authError');
      history.replaceState({}, '', address.pathname + address.search);
    }

    const saved = localStorage.getItem('popocarry_lang'); if (saved === 'ko' || saved === 'en') setLang(saved);
    getProviders().then(p => setProviders(Object.keys(p || {}))).catch(() => {});
    fetch('/api/profile', { cache: 'no-store' }).then(r => { if (r.ok) return loadProfile(); }).catch(() => {});
    return () => window.removeEventListener('popstate', restoreAddress);
  }, []);
  useEffect(() => {
    let active = true; setLoading(true); setLoadError('');
    if (view === 'trade') setSelectedOrder(null);
    (async () => {
      if (view === 'trade' && selectedOrderId) {
        const value = await apiRequest<ServerOrder>(`/api/orders/${encodeURIComponent(selectedOrderId)}`);
        if (active) setSelectedOrder(mapOrder(value));
      } else if (view === 'landing' || view === 'browse') {
        const values = await apiRequest<ServerOrder[]>(`/api/orders?${view === 'browse' && showMine ? 'mine=1&' : ''}q=${encodeURIComponent(searchQuery)}`);
        if (active) setOrders(values.map(mapOrder));
      }
    })().catch(e => { if (active) setLoadError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, selectedOrderId, refresh, showMine, searchQuery]);
  useEffect(() => {
    if (view !== 'trade' || !selectedOrderId || !user) return;
    let stopped = false, pending = false, delay = 3000;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (stopped || pending) return;
      clearTimeout(timer);
      if (document.visibilityState === 'visible' && navigator.onLine && !busyRef.current) {
        pending = true;
        try {
          const response = await fetch('/api/orders/' + encodeURIComponent(selectedOrderId), { cache: 'no-store' });
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            if (!stopped) setLoadError(lang === 'ko' ? '로그인 및 주문 접근 권한을 확인해 주세요.' : 'Please check your login and order access.');
            stopped = true;
            return;
          }
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error('refresh failed');
          if (!stopped && selectedIdRef.current === selectedOrderId && !busyRef.current) {
            setSelectedOrder(mapOrder(result.data));
            setLoadError('');
          }
          delay = 3000;
        } catch {
          delay = Math.min(delay * 2, 30000);
        } finally { pending = false; }
      }
      if (!stopped) timer = setTimeout(poll, delay);
    };
    const resume = () => { if (!pending) void poll(); };
    timer = setTimeout(poll, delay);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { stopped = true; clearTimeout(timer); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, [view, selectedOrderId, user?.id, lang]);
  useEffect(() => {
    if (!user) return;
    setEditName(user.name); setEditPhone(user.phone); setEditCity(user.city); setEditBio(user.bio); setEditBank(user.payoutBank); setEditAccount('');
  }, [user]);
  useEffect(() => {
    if (!showAuthModal) return;
    const previous = document.activeElement as HTMLElement;
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) setShowAuthModal(false);
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('input,button:not(:disabled),a[href]');
      if (!nodes?.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    };
    window.addEventListener('keydown', keydown); return () => { window.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [showAuthModal]);
  const changeLang = (next: Lang) => { setLang(next); localStorage.setItem('popocarry_lang', next); };
  const handleSocialAuth = (provider: 'Kakao' | 'Google') => run(async () => {
    await signIn(provider.toLowerCase(), { callbackUrl: location.href });
  });
  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault(); run(async () => {
      if (isRegister) await apiRequest('/api/auth/register', { email: authEmail, password: authPassword, name: authName });
      const result = await signIn('credentials', { email: authEmail, password: authPassword, redirect: false });
      if (!result?.ok) throw new Error(lang === 'ko' ? '이메일과 비밀번호를 확인해 주세요.' : 'Check your email and password.');
      await loadProfile(); setShowAuthModal(false); setRefresh(v => v + 1);
    });
  };
  const handleLogout = () => run(async () => { await signOut({ redirect: false }); setUser(null); setSelectedOrder(null); setView('landing'); setRefresh(v => v + 1); });
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault(); run(async () => {
      await apiRequest('/api/profile', profileTab === 'bank' ? { payoutBank: editBank, payoutAccount: editAccount } : { name: editName, phone: editPhone, city: editCity, bio: editBio });
      await loadProfile(); showToast(lang === 'ko' ? '저장했습니다.' : 'Saved.');
    });
  };
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault(); if (!user) { setShowAuthModal(true); return; }
    run(async () => {
      const location = locations[orderOriginIndex];
      const created = await apiRequest<{ id: string }>('/api/orders', { titleKo: orderTitle, originKo: location.country.ko, originFlag: location.flag, destKo: orderDestination, priceKrw: orderPrice, rewardKrw: orderReward, imageUrl: orderImg, quantity: orderQuantity, options: orderOptions, wantedDate: orderDate, productUrl: orderUrl, categoryKo: '일반 주문', storeKo: location.store.ko });
      setSelectedOrderId(created.id); setView('trade'); await loadProfile();
    });
  };
  const tradeAction = (action: string, data: object = {}) => run(async () => { await apiRequest(`/api/orders/${selectedOrderId}`, { action, ...data }); await loadTrade(); });
  const handleSubmitOffer = () => tradeAction('offer', { arrivalDate: offerDate, rewardKrw: offerReward });
  const handleOpenTossPayment = () => run(async () => {
    const prepared = await apiRequest<{ clientKey: string; amount: number; orderId: string; orderName: string }>('/api/payments/prepare', { orderId: selectedOrderId });
    const { loadTossPayments } = await import('@tosspayments/payment-sdk');
    const toss = await loadTossPayments(prepared.clientKey);
    await toss.requestPayment('카드', { amount: prepared.amount, orderId: prepared.orderId, orderName: prepared.orderName, successUrl: `${location.origin}/payments/success`, failUrl: `${location.origin}/payments/fail?trade=${encodeURIComponent(selectedOrderId)}` });
  });
  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    run(async () => { const data = new FormData(); data.set('file', file); data.set('orderId', selectedOrderId); await apiRequest('/api/upload', undefined, data); await loadTrade(); });
  };
  const handleRefundEscrow = () => run(async () => {
    await apiRequest('/api/payments/cancel', { orderId: selectedOrderId, cancelReason: issueReason }); await loadTrade(); showToast(lang === 'ko' ? '요청을 접수했습니다.' : 'Request received.');
  });
  const [issueReason, setIssueReason] = useState('');
  const [showIssue, setShowIssue] = useState(false);
  const handleVerifyPin = () => tradeAction('verify-pin', { pin: pinInput });
  const loadOlderChat = () => run(async () => {
    const id = selectedOrderId, first = visibleMessages[0]?.id;
    if (!first) return;
    const result = await apiRequest<{messages: ChatMessage[]; hasMore: boolean}>('/api/chat?orderId=' + encodeURIComponent(id) + '&before=' + encodeURIComponent(first));
    if (selectedIdRef.current !== id) return;
    const box = chatBox.current;
    if (box && result.messages.length) historyPosition.current = { height: box.scrollHeight, top: box.scrollTop };
    setOlderMessages(previous => [...result.messages.map(m => ({...m, time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', {hour:'2-digit',minute:'2-digit'}) : ''})), ...previous]);
    setHistoryEnd(!result.hasMore);
  });
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const id = selectedOrderId, message = chatInput.trim();
    if (!message) return;
    run(async () => {
      await apiRequest('/api/chat', { orderId: id, text: message });
      if (selectedIdRef.current !== id) return;
      setChatInput(current => current.trim() === message ? '' : current);
      followChat.current = true;
      await loadTrade();
    });
  };
  const estFee = Math.round((orderPrice + orderReward) * 0.08);
  const estTotal = orderPrice + orderReward + estFee;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 flex flex-col">
      
      {/* 1. GNB 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 group text-left cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition">
              P
            </div>
            <span className="font-black text-xl tracking-tight text-slate-950">
              Popo<span className="text-teal-600">Carry</span>
            </span>
          </button>

          <nav className="flex items-center gap-8 text-sm font-bold text-slate-700">
            <button 
              onClick={() => setView('create')} 
              className={`hover:text-teal-600 transition flex items-center gap-1.5 cursor-pointer ${view === 'create' ? 'text-teal-600 font-black' : ''}`}
            >
              <ShoppingBag className="w-4 h-4 text-teal-600" />
              <span>{t.navOrder}</span>
            </button>
            <button 
              onClick={() => setView('browse')} 
              className={`hover:text-teal-600 transition flex items-center gap-1.5 cursor-pointer ${view === 'browse' ? 'text-teal-600 font-black' : ''}`}
            >
              <Search className="w-4 h-4 text-teal-600" />
              <span>{t.navBrowse}</span>
            </button>
            <button 
              onClick={() => {
                if (view !== 'landing') setView('landing');
                setTimeout(() => document.getElementById('how-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
              className="hover:text-teal-600 transition flex items-center gap-1.5 text-slate-500 font-medium cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t.navHow}</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => changeLang(lang === 'ko' ? 'en' : 'ko')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              {lang.toUpperCase()}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <button onClick={() => setView('profile')} className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left">
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs" />
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">{user.name}</span>
                </button>
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer ml-1" title={t.signOutBtn}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                {t.signInBtn}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. 메인 뷰 */}
      <main className="flex-1">
{loadError && <div role="alert" className="max-w-xl mx-auto px-6 py-4 text-xs text-rose-700">{loadError}<button onClick={()=>{if(!user)setShowAuthModal(true);else setRefresh(v=>v+1);}} className="ml-3 underline">{!user?t.signInBtn:(lang==='ko'?'다시 확인':'Retry')}</button></div>}
{loading && view==='trade' && <p role="status" className="max-w-5xl mx-auto p-6 text-xs text-slate-500">{lang==='ko'?'불러오는 중…':'Loading…'}</p>}

        {/* [VIEW: PROFILE] */}
        {view === 'profile' && user && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <button onClick={() => setView('landing')} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> {t.backBtn}
            </button>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-950">{user.name}</h2>
                      <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-teal-600" />
                        {user.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{user.email} · {user.city}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">주문 요청</span>
                    <strong className="text-base font-black text-slate-900">{user.totalOrders}건</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">전달 완료</span>
                    <strong className="text-base font-black text-teal-700">{user.completedDeliveries}회</strong>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
                <button 
                  onClick={() => setProfileTab('basic')}
                  className={`pb-2.5 transition cursor-pointer border-b-2 ${profileTab === 'basic' ? 'border-teal-600 text-teal-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {t.tabProfileInfo}
                </button>
                
                <button 
                  onClick={() => setProfileTab('bank')}
                  className={`pb-2.5 transition cursor-pointer border-b-2 ${profileTab === 'bank' ? 'border-teal-600 text-teal-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {t.tabBankInfo}
                </button>
              </div>

              {profileTab === 'basic' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.nameLabel}</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.phoneLabel}</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.cityLabel}</label>
                      <input 
                        type="text" 
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.emailLabel}</label>
                      <input 
                        type="text" 
                        disabled 
                        value={user.email}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.bioLabel}</label>
                    <textarea 
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                    />
                  </div>

                  <button 
                    type="submit" disabled={busy}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    {t.btnSaveProfile}
                  </button>
                </form>
              )}

              {profileTab === 'bank' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.bankNameLabel}</label>
                      <input 
                        type="text" 
                        value={editBank}
                        onChange={(e) => setEditBank(e.target.value)}
                        placeholder="예: 카카오뱅크, 신한은행"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t.accountNumberLabel}</label>
                      <input 
                        type="text" 
                        value={editAccount}
                        onChange={(e) => setEditAccount(e.target.value)}
                        placeholder={user.payoutAccount || (lang==='ko'?'계좌번호':'Account number')}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" disabled={busy}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    {t.btnSaveProfile}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* [VIEW 1: LANDING] */}
        {view === 'landing' && (
          <div className="space-y-16 pb-20">
            {/* 히어로 섹션 */}
            <section className="relative pt-16 pb-20 border-b border-slate-200/70 bg-gradient-to-b from-teal-50/50 via-white to-white text-center px-4 sm:px-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 bg-teal-100/70 border border-teal-200 text-teal-900 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.badgeTrusted}</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
                  {t.heroTitle}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
                    {t.heroTitleSub}
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  {t.heroDesc}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button 
                    onClick={() => setView('create')}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm px-8 py-4 rounded-xl transition shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t.btnOrderHero}</span>
                  </button>
                  <button 
                    onClick={() => setView('browse')}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-8 py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plane className="w-4 h-4 text-teal-400" />
                    <span>{t.btnTripHero}</span>
                  </button>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> {t.trustEscrow}</span>
                  <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-teal-600" /> {t.trustReceipt}</span>
                  <span className="flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-teal-600" /> {t.trustPin}</span>
                </div>
              </div>
            </section>

            {/* 이용방법 (How It Works) 공식 4단계 섹션 */}
            <section id="how-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 scroll-mt-20">
              <div className="text-center space-y-3 mb-10">
                <span className="text-[11px] font-black tracking-widest uppercase text-teal-700">Official Process</span>
                <h2 className="text-3xl font-extrabold text-slate-950">{t.howTitle}</h2>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">{t.howSub}</p>

                <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold mt-4">
                  <button 
                    onClick={() => setHowTab('shopper')}
                    className={`px-6 py-2.5 rounded-xl transition cursor-pointer ${howTab === 'shopper' ? 'bg-white text-teal-700 shadow-sm font-black' : 'text-slate-500'}`}
                  >
                    {t.howTabShopper}
                  </button>
                  <button 
                    onClick={() => setHowTab('traveler')}
                    className={`px-6 py-2.5 rounded-xl transition cursor-pointer ${howTab === 'traveler' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {t.howTabTraveler}
                  </button>
                </div>
              </div>

              {howTab === 'shopper' ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">01</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step1Shop}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step1ShopDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">02</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step2Shop}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step2ShopDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">03</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step3Shop}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step3ShopDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-sm">04</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step4Shop}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step4ShopDesc}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">01</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step1Travel}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step1TravelDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">02</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step2Travel}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step2TravelDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">03</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step3Travel}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step3TravelDesc}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-sm">04</div>
                    <h4 className="font-bold text-sm text-slate-950">{t.step4Travel}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.step4TravelDesc}</p>
                  </div>
                </div>
              )}
            </section>

            {/* 거래 안전 보장 체계 */}
            <section className="bg-slate-900 text-white py-16 px-4 sm:px-6">
              <div className="max-w-6xl mx-auto space-y-10">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black tracking-widest uppercase text-teal-400">Security Guarantee</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">{t.safetyHeading}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-2.5">
                    <Lock className="w-7 h-7 text-teal-400" />
                    <h4 className="font-bold text-sm">{t.safety1Title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.safety1Desc}</p>
                  </div>
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-2.5">
                    <Receipt className="w-7 h-7 text-teal-400" />
                    <h4 className="font-bold text-sm">{t.safety2Title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.safety2Desc}</p>
                  </div>
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-2.5">
                    <KeyRound className="w-7 h-7 text-teal-400" />
                    <h4 className="font-bold text-sm">{t.safety3Title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.safety3Desc}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 실시간 등록 주문 목록 */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{t.recentOrdersTitle}</h2>
                  <p className="text-xs text-slate-500 mt-1">{t.recentOrdersSub}</p>
                </div>
                <button onClick={() => setView('browse')} className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer">
                  <span>{t.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {!loading && !loadError && orders.length===0 && <p className="text-xs text-slate-400 py-4">{lang==='ko'?'등록된 주문이 없습니다.':'No orders yet.'}</p>}{orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-500 hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="relative">
                        <img src={order.imageUrl} alt="" className="w-full h-40 object-cover" />
                        <span className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {order.originFlag} {order.originKo.split('·')[0]}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{lang === 'ko' ? order.categoryKo : order.categoryEn}</span>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">{lang === 'ko' ? order.titleKo : order.titleEn}</h5>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">{t.rewardLabel}</span>
                          <strong className="text-teal-700 font-extrabold">{formatPrice(order.rewardKrw)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <button 
                        onClick={() => { setSelectedOrderId(order.id); setView('trade'); }}
                        className="w-full py-2 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{order.status === 'OFFER_MADE' ? t.btnViewRoom : t.btnMakeOffer}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* [VIEW 2: CREATE ORDER] */}
        {view === 'create' && (
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
              <div>
                <span className="text-[11px] font-black uppercase text-teal-600 tracking-wider">Order an item</span>
                <h2 className="text-2xl font-black text-slate-950 mt-1">{t.createTitle}</h2>
                <p className="text-xs text-slate-500 mt-1">{t.createSub}</p>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.itemNameLabel}</label>
                  <input 
                    type="text" 
                    required 
                    value={orderTitle}
                    onChange={(e) => setOrderTitle(e.target.value)}
                    placeholder={t.itemPlaceHolder} 
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.storeLocationLabel}</label>
                  <select 
                    value={orderOriginIndex}
                    onChange={(e) => setOrderOriginIndex(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
                  >
                    {locations.map((loc, idx) => (
                      <option key={idx} value={idx}>
                        {loc.flag} {lang === 'ko' ? loc.country.ko : loc.country.en} ({lang === 'ko' ? loc.store.ko : loc.store.en})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.priceLabel}</label>
                    <input 
                      type="number" 
                      required 
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.rewardInputLabel}</label>
                    <input 
                      type="number" 
                      required 
                      value={orderReward}
                      onChange={(e) => setOrderReward(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.imgUrlLabel}</label>
                  <input 
                    type="url" 
                    value={orderImg}
                    onChange={(e) => setOrderImg(e.target.value)}
                    placeholder="https://images.unsplash.com/..." 
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                  />
                </div>

<div className="grid grid-cols-2 gap-3">
<label className="block font-bold text-slate-700">{lang==='ko'?'도착 도시':'Destination'}<input aria-label={lang==='ko'?'도착 도시':'Destination'} required value={orderDestination} onChange={e=>setOrderDestination(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" /></label>
<label className="block font-bold text-slate-700">{lang==='ko'?'희망 수령일':'Receive by'}<input aria-label={lang==='ko'?'희망 수령일':'Receive by'} required type="date" min={new Date().toISOString().slice(0,10)} value={orderDate} onChange={e=>setOrderDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" /></label>
<label className="block font-bold text-slate-700">{lang==='ko'?'수량':'Quantity'}<input type="number" required min={1} max={100} value={orderQuantity} onChange={e=>setOrderQuantity(Number(e.target.value))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" /></label>
<label className="block font-bold text-slate-700">{lang==='ko'?'옵션':'Options'}<input maxLength={500} value={orderOptions} onChange={e=>setOrderOptions(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" /></label>
</div><label className="block font-bold text-slate-700">{lang==='ko'?'상품 URL (선택)':'Product URL (optional)'}<input type="url" value={orderUrl} onChange={e=>setOrderUrl(e.target.value)} placeholder="https://" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" /></label>
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-2">
                  <span className="font-black text-teal-900 block text-[11px] uppercase tracking-wider">{t.estBoxTitle}</span>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.itemPriceText}</span>
                    <span className="font-bold text-slate-800">{formatPrice(orderPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.rewardLabel}</span>
                    <span className="font-bold text-slate-800">{formatPrice(orderReward)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.platformFeeText}</span>
                    <span className="font-bold text-slate-800">{formatPrice(estFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-teal-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>{t.totalDepositText}</span>
                    <span className="text-teal-700 font-extrabold text-base">{formatPrice(estTotal)}</span>
                  </div>
                </div>

                <button 
                  type="submit" disabled={busy}
                  className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {t.btnPublishOrder}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* [VIEW 3: BROWSE ORDERS] */}
        {view === 'browse' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{t.browseTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.browseSub}</p>
              </div>
              <button 
                onClick={() => setView('create')}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.postRequestBtn}</span>
              </button>
            </div>

<div className="flex gap-3 items-center text-xs"><input aria-label={lang==='ko'?'주문 검색':'Search orders'} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={lang==='ko'?'상품명 / 도시 검색':'Item / city'} className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 bg-slate-50" />{user && <button onClick={()=>setShowMine(v=>!v)} className={`px-4 py-3 rounded-xl border ${showMine?'bg-teal-50 border-teal-300 text-teal-700':'border-slate-200 text-slate-600'}`}>{lang==='ko'?'내 거래':'My orders'}</button>}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && !loadError && orders.length===0 && <p className="text-xs text-slate-400 py-4">{lang==='ko'?'등록된 주문이 없습니다.':'No orders yet.'}</p>}{orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-500 hover:shadow-lg transition p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative">
                      <img src={order.imageUrl} alt="" className="w-full h-44 object-cover rounded-2xl" />
                      <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {order.originFlag} {order.originKo}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{lang === 'ko' ? order.storeKo : order.storeEn}</span>
                      <h4 className="font-extrabold text-sm text-slate-950 line-clamp-2 leading-snug">{lang === 'ko' ? order.titleKo : order.titleEn}</h4>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
                      <div className="flex justify-between text-slate-500">
                        <span>{t.itemPriceText}</span>
                        <strong>{formatPrice(order.priceKrw)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{t.rewardLabel}</span>
                        <strong className="text-teal-600 font-black text-sm">{formatPrice(order.rewardKrw)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => { setSelectedOrderId(order.id); setView('trade'); }}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{order.status === 'PENDING' ? t.btnMakeOffer : t.btnViewRoom}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [VIEW 4: TRADE ROOM] */}
        {view === 'trade' && selectedOrder && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('browse')} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> {t.backBtn}
              </button>{selectedOrder.role !== 'VISITOR' && <button onClick={()=>setShowIssue(v=>!v)} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{t.reportIssueBtn}</button>}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-teal-600">{t.progress1}</span>
                <span className={['OFFER_MADE', 'PAID', 'PURCHASED', 'PAYOUT_PENDING'].includes(selectedOrder.status) ? 'text-teal-600' : 'text-slate-400'}>{t.progress2}</span>
                <span className={['PAID', 'PURCHASED', 'PAYOUT_PENDING'].includes(selectedOrder.status) ? 'text-teal-600' : 'text-slate-400'}>{t.progress3}</span>
                <span className={['PURCHASED', 'PAYOUT_PENDING'].includes(selectedOrder.status) ? 'text-teal-600' : 'text-slate-400'}>{t.progress4}</span>
                <span className={selectedOrder.status === 'PAYOUT_PENDING' ? 'text-teal-600' : 'text-slate-400'}>{t.progress5}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-600 to-emerald-400 h-full transition-all duration-500"
                  style={{
                    width: selectedOrder.status === 'PAYOUT_PENDING' ? '100%' 
                      : selectedOrder.status === 'PURCHASED' ? '80%' 
                      : selectedOrder.status === 'PAID' ? '60%' 
                      : selectedOrder.status === 'OFFER_MADE' ? '40%' : '20%'
                  }}
                />
              </div>
            </div>

            {showIssue && selectedOrder.role !== 'VISITOR' && <div className="bg-white p-5 rounded-3xl border border-slate-200/90 space-y-3"><textarea aria-label={t.reportIssueBtn} value={issueReason} onChange={e=>setIssueReason(e.target.value)} maxLength={1000} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs" /><div className="flex gap-3">{selectedOrder.role==='BUYER' && ['PENDING','OFFER_MADE','PAID','PURCHASED','DISPUTED'].includes(selectedOrder.status) && <button disabled={busy||!issueReason.trim()} onClick={handleRefundEscrow} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">{lang==='ko'?'취소 / 환불 요청':'Request cancellation / refund'}</button>}{['PAID','PURCHASED','PAYOUT_PENDING'].includes(selectedOrder.status) && <button disabled={busy||!issueReason.trim()} onClick={()=>tradeAction('dispute',{reason:issueReason})} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold">{lang==='ko'?'문제 신고 접수':'Report issue'}</button>}</div></div>}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex gap-4 items-start">
                    <img src={selectedOrder.imageUrl} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-100" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {selectedOrder.originFlag} {selectedOrder.originKo} ➔ {selectedOrder.destKo}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">{lang === 'ko' ? selectedOrder.titleKo : selectedOrder.titleEn}</h3>
                      <p className="text-xs text-slate-500">{lang === 'ko' ? selectedOrder.storeKo : selectedOrder.storeEn}</p>
                      <div className="text-xs font-bold text-slate-800 pt-1">
                        {t.itemPriceText}: <strong>{formatPrice(selectedOrder.priceKrw)}</strong>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.status === 'PENDING' && selectedOrder.role === 'VISITOR' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-teal-600" />
                        <strong className="text-xs font-bold text-slate-900">{t.travelerOfferCardTitle}</strong>
                      </div>
                      <p className="text-xs text-slate-500">{t.travelerOfferCardSub}</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
  <label className="font-bold text-slate-700">{t.arrivalLabel}<input aria-label={t.arrivalLabel} type="date" value={offerDate} onChange={e=>setOfferDate(e.target.value)} min={new Date().toISOString().slice(0,10)} max={selectedOrder.wantedDate} className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-white" /></label>
  <label className="font-bold text-slate-700">{t.rewardLabel}<input aria-label={t.rewardLabel} type="number" min={0} max={10000000} value={offerReward} onChange={e=>setOfferReward(Number(e.target.value))} className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-white" /></label>
</div>
<button
                        onClick={handleSubmitOffer}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        {t.btnSendOfferDemo}
                      </button>
                    </div>
                  )}

                  {(selectedOrder.offers||[]).map(offer => <div key={offer.id} className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3"><div className="flex justify-between items-center text-xs"><strong>{offer.travelerName}</strong><span>{offer.arrivalDate} · {formatPrice(offer.rewardKrw)}</span></div>{selectedOrder.status==='PENDING' && offer.status==='PENDING' && <button onClick={()=>tradeAction(selectedOrder.role==='BUYER'?'accept':'withdraw',{offerId:offer.id})} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl">{selectedOrder.role==='BUYER'?(lang==='ko'?'제안 수락':'Accept offer'):(lang==='ko'?'제안 철회':'Withdraw offer')}</button>}</div>)}
                  {selectedOrder.status === 'OFFER_MADE' && (
                    <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <img src={selectedOrder.travelerAvatar || AVATAR_PLACEHOLDER} className="w-10 h-10 rounded-full object-cover border border-teal-200" alt="" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">{selectedOrder.travelerName || ''}</strong>
                            <span className="text-[11px] text-teal-700">{t.arrivalLabel}: <strong>{selectedOrder.arrivalDate || ''}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">{t.rewardLabel}</span>
                          <strong className="text-teal-700 text-sm font-black">{formatPrice(selectedOrder.rewardKrw)}</strong>
                        </div>
                      </div>
                      <button 
                        disabled={busy || selectedOrder.role !== 'BUYER'} onClick={handleOpenTossPayment}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{t.btnAcceptEscrow}</span>
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'PAID' && selectedOrder.role === 'TRAVELER' && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Receipt className="w-4 h-4 text-amber-600" />
                        <span>{t.receiptWaitTitle}</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">{t.receiptWaitDesc}</p>
                      <label className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>실물 영수증 사진 파일 선택 및 업로드</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleRealFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  {['PURCHASED', 'PAYOUT_PENDING'].includes(selectedOrder.status) && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <strong className="text-emerald-950 font-bold block">{t.receiptVerifiedTitle}</strong>
                        <span className="text-emerald-700">{t.receiptVerifiedDesc}</span>{selectedOrder.receiptUrl && <a href={selectedOrder.receiptUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 underline text-teal-700">{lang==='ko'?'영수증 보기':'View receipt'}</a>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      <span>{t.chatTitle}</span>
                    </span>
                  </div>

                  <div ref={chatBox} onScroll={e => { const box = e.currentTarget; followChat.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48; }} className="h-44 overflow-y-auto space-y-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    {!historyEnd && visibleMessages.length > 0 && <button type="button" disabled={busy} onClick={loadOlderChat} className="block mx-auto text-[10px] text-teal-700 disabled:opacity-50">{lang === 'ko' ? '이전 대화 보기' : 'Earlier messages'}</button>}
                    {visibleMessages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`flex flex-col ${msg.sender === selectedOrder.role ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-slate-400 font-bold px-1">{msg.name} · {msg.time}</span>
                        <div className={`p-2.5 rounded-2xl max-w-[85%] ${
                          msg.sender === 'SYSTEM' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                          msg.sender === selectedOrder.role ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2"><fieldset disabled={busy || selectedOrder.role === 'VISITOR' || !selectedOrder.travelerName} className="contents">
                    <input 
                      type="text" 
                      maxLength={2000}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t.chatPlaceholder} 
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                    />
                    <button type="submit" disabled={busy} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                      {t.sendBtn}
                    </button></fieldset>
                  </form><button onClick={()=>run(loadTrade)} className="text-[10px] text-teal-700">{lang==='ko'?'새 메시지 확인':'Refresh messages'}</button>
                </div>
              </div>

              <div className="md:col-span-5 space-y-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Security Handshake</span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">PIN Required</span>
                  </div>

                  {selectedOrder.role === 'BUYER' && selectedOrder.deliveryPin && <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">{t.pinCardTitle}</span>
                    <strong className="text-3xl font-mono font-black text-amber-950 tracking-widest block">{selectedOrder.deliveryPin}</strong>
                    <p className="text-[10px] text-amber-700 leading-tight pt-1">
                      {t.pinCardDesc}
                    </p>
                  </div>}

                  {selectedOrder.status === 'PURCHASED' && selectedOrder.role === 'TRAVELER' ? (
                    <div className="space-y-2 pt-2">
                      <label className="block text-[11px] font-bold text-slate-700">{t.pinInputLabel}</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder="••••" inputMode="numeric" autoComplete="off" 
                          className="flex-1 p-2.5 border border-slate-200 rounded-xl text-center font-mono font-black text-sm uppercase outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button 
                          onClick={handleVerifyPin}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          {t.btnVerifyPin}
                        </button>
                      </div>
                    </div>
                  ) : selectedOrder.status === 'PAYOUT_PENDING' ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                      <span className="text-emerald-700 font-extrabold text-xs block">{t.settledBadgeTitle}</span>
                      <p className="text-[11px] text-emerald-600">{t.settledBadgeSub}</p>
                    </div>
                  ) : null}

                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px]">결제 내역</span>
                    <div className="flex justify-between text-slate-500">
                      <span>{t.itemPriceText}</span>
                      <strong className="text-slate-800">{formatPrice(selectedOrder.priceKrw)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t.rewardLabel}</span>
                      <strong className="text-slate-800">{formatPrice(selectedOrder.rewardKrw)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{t.platformFeeText}</span>
                      <strong className="text-slate-800">{formatPrice(Math.round((selectedOrder.priceKrw + selectedOrder.rewardKrw) * 0.08))}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black text-slate-900 text-sm">
                      <span>{t.totalDepositText}</span>
                      <strong className="text-teal-700">{formatPrice(Math.round((selectedOrder.priceKrw + selectedOrder.rewardKrw) * 1.08))}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. 로그인/가입 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.authModalTitle} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mx-auto font-black text-lg">
                P
              </div>
              <h3 className="text-lg font-black text-slate-900">{t.authModalTitle}</h3>
              <p className="text-xs text-slate-500">{t.authModalSub}</p>
            </div>

            <div className="space-y-2.5">
              <button 
                disabled={busy || !providers.includes('kakao')} onClick={() => handleSocialAuth('Kakao')}
                className="w-full py-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
              >
                <span>💬 {t.kakaoBtn}</span>
              </button>
              <button 
                disabled={busy || !providers.includes('google')} onClick={() => handleSocialAuth('Google')}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 border border-slate-200 transition shadow-xs cursor-pointer"
              >
                <span className="text-red-500 font-bold">G</span>
                <span>{t.googleBtn}</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[11px]">{t.orEmail}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-2.5 text-left text-xs">{isRegister && <input aria-label={lang==='ko'?'이름':'Name'} value={authName} onChange={e=>setAuthName(e.target.value)} required maxLength={60} placeholder={lang==='ko'?'이름 / 닉네임':'Name'} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition" />}
              <input 
                type="email" 
                required 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="email@example.com" 
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
              <input 
                type="password" 
                required 
                minLength={isRegister?12:undefined} autoComplete={isRegister?'new-password':'current-password'} value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="비밀번호" 
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
              <button 
                type="submit" disabled={busy}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {isRegister?(lang==='ko'?'회원가입':'Sign up'):(lang==='ko'?'로그인':'Sign in')}
              </button>
            </form><button onClick={()=>setIsRegister(v=>!v)} className="text-[11px] text-teal-700 underline">{isRegister?(lang==='ko'?'로그인으로 돌아가기':'Back to sign in'):(lang==='ko'?'이메일로 회원가입':'Create an email account')}</button>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toastMsg && (
        <div role="status" onClick={()=>setToastMsg('')} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl z-50">
          {toastMsg}
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 text-xs text-slate-500 text-center mt-auto">
        <div className="max-w-6xl mx-auto space-y-1">
          <span className="font-black text-slate-900 text-sm">PopoCarry</span>
          <p className="text-[11px] text-slate-400">Peer-to-Peer Global Hand-Carry Delivery Marketplace.</p>
        </div>
      </footer>
    </div>
  );
}


