import * as Font from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Chrome,
  Heart,
  Home,
  Lock,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  Ticket,
  Trash2,
  User,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebaseConfig';
import './web-input-fix.css';

const db = getFirestore();

type CoffeeCustomization = {
  size: 'Small' | 'Medium' | 'Large';
  sugar: 'None' | 'Less' | 'Normal' | 'Extra';
  milk: 'None' | 'Full Cream' | 'Oat Milk';
  ice: 'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice';
};


const AdminDashboard = ({ visible, onClose, transactions }: { visible: boolean, onClose: () => void, transactions: any[] }) => {
  const [activeTab, setActiveTab] = useState<'Home' | 'Payment'>('Home');
  const totalSales = transactions.reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just Now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just Now';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.adminModalContainer}>
        <View style={styles.adminSidebar}>
          <Text style={styles.adminLogo}>☕︎</Text>
          <TouchableOpacity style={activeTab === 'Home' ? styles.adminSideTabActive : styles.adminSideTab} onPress={() => setActiveTab('Home')}>
            <Text style={activeTab === 'Home' ? styles.adminSideTabTextActive : styles.adminSideTabText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'Payment' ? styles.adminSideTabActive : styles.adminSideTab} onPress={() => setActiveTab('Payment')}>
            <Text style={activeTab === 'Payment' ? styles.adminSideTabTextActive : styles.adminSideTabText}>Payment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adminMainContent}>
          <View style={styles.adminHeaderRow}>
            <View>
              <Text style={styles.adminWelcomeTitle}>{activeTab === 'Home' ? 'Sales' : 'Payment Tracker'}</Text>
              
            </View>
            <TouchableOpacity onPress={onClose} style={styles.adminCloseButton}><X size={20} color="#121212" /></TouchableOpacity>
          </View>

          {activeTab === 'Home' && (
            <View style={{ flex: 1 }}>
              <View style={styles.adminKpiRow}>
                <View style={styles.adminKpiCard}>
                  <Text style={styles.adminKpiLabel}>Total Order</Text>
                  <Text style={styles.adminKpiValue}>{transactions.length}</Text>
                </View>
                <View style={styles.adminKpiCard}>
                  <Text style={styles.adminKpiLabel}>New Customer</Text>
                  <Text style={[styles.adminKpiValue, { color: '#000000' }]}>1,012</Text>
                </View>
                <View style={styles.adminKpiCard}>
                  <Text style={styles.adminKpiLabel}>Total Sales</Text>
                  <Text style={styles.adminKpiValue}>₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>
              </View>

              <View style={styles.adminTableContainer}>
                <Text style={styles.adminTableTitle}>Recent Order</Text>
                <FlatList 
                  data={transactions} 
                  keyExtractor={(item: any) => item.id} 
                  renderItem={({ item }) => (
                    <View style={styles.adminTableRow}>
                      <Text style={styles.adminTableTextId}>{item.transactionId || 'ORD-UNKNOWN'}</Text>
                      <Text style={styles.adminTableTextItems}>{item.items ? `${item.items.length} Item(s)` : 'Coffee Item'}</Text>
                      <Text style={styles.adminTableTextAmount}>₱{item.totalAmount || '0.00'}</Text>
                      <Text style={styles.adminTableTextStatus}>{item.status || 'Success'}</Text>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.adminEmptyText}>No sales transactions caught in Firestore.</Text>}
                />
              </View>
            </View>
          )}

          {activeTab === 'Payment' && (
            <View style={styles.adminTableContainer}>
              <Text style={styles.adminTableTitle}>Live Customer Settlement Records</Text>
              <View style={styles.paymentTableHeader}>
                <Text style={[styles.paymentHeaderCell, { width: '12%' }]}>Time</Text>
                <Text style={[styles.paymentHeaderCell, { width: '18%' }]}>Order ID</Text>
                <Text style={[styles.paymentHeaderCell, { width: '35%' }]}>Items Breakdown</Text>
                <Text style={[styles.paymentHeaderCell, { width: '15%' }]}>Amount</Text>
                <Text style={[styles.paymentHeaderCell, { width: '20%', textAlign: 'right' }]}>Payment Type</Text>
              </View>

              <FlatList
                data={transactions}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.paymentTableRow}>
                    <Text style={[styles.paymentRowCell, styles.paymentTimeText, { width: '12%' }]}>{formatTime(item.timestamp)}</Text>
                    <Text style={[styles.paymentRowCell, styles.paymentIdText, { width: '18%' }]}>{item.transactionId || 'ORD-UNKNOWN'}</Text>
                    <View style={{ width: '35%', paddingRight: 10 }}>
                      {item.items?.map((coffee: any, idx: number) => (
                        <View key={idx} style={{ marginBottom: 4 }}>
                          <Text style={styles.paymentCoffeeNameText}>{coffee.name}</Text>
                          {coffee.customs && <Text style={styles.paymentCoffeeCustomText}>({coffee.customs.size} | Sugar: {coffee.customs.sugar})</Text>}
                        </View>
                      )) || <Text style={styles.paymentCoffeeNameText}>Coffee Item</Text>}
                    </View>
                    <Text style={[styles.paymentRowCell, styles.paymentAmountText, { width: '15%' }]}>₱{parseFloat(item.totalAmount || 0).toFixed(2)}</Text>
                    <View style={[{ width: '20%', alignItems: 'flex-end' }]}>
                      <View style={item.paymentMethod === 'GCASH' ? styles.methodGcashBadge : styles.methodCashBadge}>
                        <Text style={item.paymentMethod === 'GCASH' ? styles.methodGcashText : styles.methodCashText}>{item.paymentMethod || 'CASH'}</Text>
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.adminEmptyText}>No checked transactions filed yet.</Text>}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};


const AdminLoginModal = ({ visible, onClose, onVerify, email, setEmail, pass, setPass, error }: any) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.adminLogOverlay}>
        <View style={styles.adminLogWindow}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <Text style={[styles.adminLogTitle, { color: '#e7e7e7', fontFamily: 'Amarante' }]}>Admin Log In</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="#e7e7e7" /></TouchableOpacity>
          </View>
          <Text style={[styles.adminLogSubtitle, { fontFamily: 'CoffeeFont' }]}>Please enter your details</Text>
          <Text style={styles.inlineLabel}>Email</Text>
          <TextInput style={styles.cleanUnderlineInput} value={email} onChangeText={setEmail} placeholder="Admin Access Only" placeholderTextColor="#CCC" autoCapitalize="none" /> 
          <Text style={styles.inlineLabel}>Password</Text>
          <TextInput style={styles.cleanUnderlineInput} value={pass} onChangeText={setPass} secureTextEntry placeholder="••••••" placeholderTextColor="#CCC" />
          {!!error && <Text style={{ color: '#ff4444', fontSize: 12, marginTop: 10 }}>{error}</Text>}
          <TouchableOpacity style={styles.purpleLogButton} onPress={onVerify}><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Log In</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const ReceiptModal = ({ visible, onClose, orderData }: { visible: boolean, onClose: () => void, orderData: any }) => {
  if (!orderData) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.receiptOverlay}>
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptBrand}>ESPRESSO EXPRESS</Text>
            <Text style={styles.receiptSub}>Davao City, Philippines</Text>
            <Text style={styles.receiptDivider}>------------------------------------------</Text>
          </View>
          
          <View style={styles.receiptBodyRow}>
            <Text style={styles.receiptLabel}>Transaction:</Text>
            <Text style={styles.receiptValue}>{orderData.transactionId}</Text>
          </View>
          <View style={styles.receiptBodyRow}>
            <Text style={styles.receiptLabel}>Mode Status:</Text>
            <Text style={styles.receiptValue}>Paid via {orderData.paymentMethod}</Text>
          </View>
          <Text style={styles.receiptDivider}>------------------------------------------</Text>
          
          <Text style={[styles.receiptLabel, { marginBottom: 8 }]}>Items Ordered:</Text>
          {orderData.items?.map((coffee: any, idx: number) => (
            <View key={idx} style={styles.receiptItemLine}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptItemName}>{coffee.name} ({coffee.customs?.size || 'Medium'})</Text>
                <Text style={styles.receiptItemDetails}>Sugar: {coffee.customs?.sugar || 'Normal'} | Milk: {coffee.customs?.milk || 'None'}</Text>
              </View>
              <Text style={styles.receiptItemPrice}>{coffee.price}</Text>
            </View>
          ))}
          
          <Text style={styles.receiptDivider}>------------------------------------------</Text>
          <View style={styles.receiptBodyRow}>
            <Text style={[styles.receiptLabel, { fontSize: 16, fontWeight: 'bold' }]}>TOTAL AMOUNT:</Text>
            <Text style={[styles.receiptValue, { fontSize: 16, fontWeight: 'bold', color: '#D17842' }]}>₱{parseFloat(orderData.totalAmount || 0).toFixed(2)}</Text>
          </View>
          
          <Text style={[styles.receiptDivider, { marginTop: 15 }]}>------------------------------------------</Text>
          <Text style={styles.receiptFooter}>Thank you for supporting Espresso Express!</Text>
          
          
          <TouchableOpacity style={styles.receiptCloseBtn} onPress={onClose}>
            <Text style={styles.receiptCloseBtnText}>Close Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

function LoginScreenView({ loginEmail, loginPassword, setLoginEmail, setLoginPassword, authError, onLogin, onGoogleLogin, setScreen, openAdminModal }: any) {
  return (
    <ImageBackground source={require('../../assets/images/background2.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screenFlexContainer}>
        <View style={styles.loginCardOverlay}>
          <TouchableOpacity onPress={() => setScreen('splash')} style={{ marginBottom: 20 }}><ArrowLeft color="white" size={24} /></TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.mainTitle, { fontFamily: 'Amarante', fontWeight: 'bold', marginBottom: 0 }]}>Welcome</Text>
            <TouchableOpacity style={styles.adminHeaderTrigger} onPress={openAdminModal}><Text style={styles.adminHeaderTriggerText}>Admin</Text></TouchableOpacity>
          </View>
          <Text style={[styles.subTitle, { fontFamily: 'CoffeeFont', fontWeight: '100', color: '#919191' }]}>Ready for your caffeine fix?</Text>
          <View style={styles.inputGroup}><Mail color="#D17842" size={20} /><TextInput placeholder="Email Address" placeholderTextColor="#888" style={styles.authInput} value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" /></View>
          <View style={styles.inputGroup}><Lock color="#D17842" size={20} /><TextInput placeholder="Password" placeholderTextColor="#888" secureTextEntry style={styles.authInput} value={loginPassword} onChangeText={setLoginPassword} /></View>
          {!!authError && <Text style={{ color: '#ff6666', marginBottom: 10 }}>{authError}</Text>}
          <TouchableOpacity style={styles.getStartedBtn} onPress={onLogin}><Text style={styles.btnText}>Login</Text></TouchableOpacity>
          <TouchableOpacity style={styles.googleBtn} onPress={onGoogleLogin}><Chrome color="white" size={20} /><Text style={[styles.btnText, { marginLeft: 10, fontSize: 16 }]}>Continue with Google</Text></TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setScreen('signup')}><Text style={{ color: '#888', fontFamily: 'Amarante', fontWeight: 'bold' }}>Sign up to Avail our Loyalty Discount <Text style={{ color: '#D17842', fontWeight: 'bold', fontFamily: 'Montserrat' }}> Sign Up</Text></Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function SignupScreenView({ signupName, signupEmail, signupPassword, setSignupName, setSignupEmail, setSignupPassword, authError, onSignup, setScreen }: any) {
  return (
    <ImageBackground source={require('../../assets/images/background2.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screenFlexContainer}>
        <View style={styles.loginCardOverlay}>
          <TouchableOpacity onPress={() => setScreen('login')} style={{ marginBottom: 20 }}><ArrowLeft color="white" size={24} /></TouchableOpacity>
          <Text style={[styles.mainTitle, { fontFamily: 'Amarante', fontWeight: '100' }]}>Register to get your member discount </Text>
          <View style={styles.inputGroup}><User color="#D17842" size={20} /><TextInput placeholder="Full Name" placeholderTextColor="#888" style={styles.authInput} value={signupName} onChangeText={setSignupName} /></View>
          <View style={styles.inputGroup}><Mail color="#D17842" size={20} /><TextInput placeholder="Email" placeholderTextColor="#888" style={styles.authInput} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" /></View>
          <View style={styles.inputGroup}><Lock color="#D17842" size={20} /><TextInput placeholder="Password" placeholderTextColor="#888" secureTextEntry style={styles.authInput} value={signupPassword} onChangeText={setSignupPassword} /></View>
          {!!authError && <Text style={{ color: '#ff6666', marginBottom: 10 }}>{authError}</Text>}
          <TouchableOpacity style={styles.getStartedBtn} onPress={onSignup}><Text style={styles.btnText}>Sign Up</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCoffee, setSelectedCoffee] = useState<any>(null);
  const [customization, setCustomization] = useState<CoffeeCustomization>({ size: 'Medium', sugar: 'Normal', milk: 'Full Cream', ice: 'Normal' });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  
  const [adminLogEmail, setAdminLogEmail] = useState('');
  const [adminLogPass, setAdminLogPass] = useState('');
  const [adminLogError, setAdminLogError] = useState('');
  const [adminWindowVisible, setAdminWindowVisible] = useState(false);
  const [adminDashboardVisible, setAdminDashboardVisible] = useState(false);
  
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH'>('CASH');
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'Please allow gallery access to update your profile.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try { const userDocRef = doc(db, "users", auth.currentUser!.uid); await updateDoc(userDocRef, { profilePic: base64String }); triggerToast("Added photo successfully!"); } catch (error) { console.error("Error updating Firestore:", error); triggerToast("Failed to save image."); }
    }
  };

  const coffeeItems = [
    { id: '1', name: 'Latte', prices: { Small: '₱20', Medium: '₱30', Large: '₱40' }, img: require('../../assets/images/latte.webp') },
    { id: '2', name: 'Espresso', prices: { Small: '₱28', Medium: '₱35', Large: '₱42' }, img: require('../../assets/images/espresso.jpg') },
    { id: '3', name: 'Black Coffee', prices: { Small: '₱80', Medium: '₱100', Large: '₱120' }, img: require('../../assets/images/blackcoffee.jpg') },
    { id: '4', name: 'Iced Coffee', prices: { Small: '₱24', Medium: '₱30', Large: '₱36' }, img: require('../../assets/images/icedcoffee.jpg') },
    { id: '5', name: 'Spanish Latte', prices: { Small: '₱50', Medium: '₱60', Large: '₱70' }, img: require('../../assets/images/spanishlatte.jpg') },
    { id: '6', name: 'Iced Mocha', prices: { Small: '₱67', Medium: '₱77', Large: '₱87' }, img: require('../../assets/images/icedmocha.webp') },
  ];

  useEffect(() => {
    async function loadFonts() { try { await Font.loadAsync({ 'CoffeeFont': require('../../assets/fonts/Pacifico-Regular (1).ttf'), 'ItalicCoffeeFont': require('../../assets/fonts/FoodBrandDemo-Regular.otf') }); setFontsLoaded(true); } catch (e) { setFontsLoaded(true); } }
    loadFonts();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userUnsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => setUserProfile(doc.data()));
    const qHistory = query(collection(db, "userHistory"), where("userId", "==", auth.currentUser.uid));
    const historyUnsub = onSnapshot(qHistory, (snapshot) => setPurchaseHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const qFavs = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
    const favsUnsub = onSnapshot(qFavs, (snapshot) => setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const qTrans = onSnapshot(collection(db, "transactions"), (snapshot) => setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => { userUnsub(); historyUnsub(); favsUnsub(); qTrans(); };
  }, [auth.currentUser]);

  const triggerToast = (message: string) => { setToastMessage(message); setToastVisible(true); setTimeout(() => setToastVisible(false), 2500); };
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { const result = await signInWithPopup(auth, provider); const user = result.user; await setDoc(doc(db, "users", user.uid), { fullName: user.displayName, email: user.email, profilePic: user.photoURL, createdAt: serverTimestamp() }, { merge: true }); triggerToast(`Welcome ${user.displayName}!`); setScreen('home'); } catch (error: any) { setAuthError(error.message); }
  };

  const handleVerifyAdminLogin = async () => {
    setAdminLogError('');
    if (!adminLogEmail || !adminLogPass) { setAdminLogError("Complete all fields."); return; }
    if (!adminLogEmail.toLowerCase().endsWith('@expresso.com')) {
      Alert.alert("Access Denied", "Unauthorized domain scope allocation access layout parameters.");
      setAdminLogError("Access Denied: Requires an @expresso.com user account structure.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, adminLogEmail, adminLogPass);
      setAdminWindowVisible(false);
      setAdminDashboardVisible(true);
      triggerToast("Welcome Back, Owner.");
    } catch (err: any) { setAdminLogError(err.message); }
  };

  const completedOrders = purchaseHistory.filter(o => o.status === 'Completed').length;
  const rawTotal = cartItems.reduce((sum, i) => sum + parseInt(i.price.replace(/[^0-9]/g, '')), 0);
  let discountPercent = 0; if (completedOrders === 4) discountPercent = 0.20; if (completedOrders === 9) discountPercent = 0.50; const finalPrice = rawTotal - (rawTotal * discountPercent);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    try {
      const userId = auth.currentUser?.uid;
      const transactionId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = serverTimestamp();

      const orderPayload = {
        userId,
        transactionId,
        items: cartItems.map(item => ({ name: item.name, price: item.price, customs: item.customs })),
        totalAmount: finalPrice,
        status: "Success",
        paymentMethod: paymentMethod,
        timestamp
      };

      await addDoc(collection(db, "userHistory"), { userId, transactionId, summary: `${cartItems.length} coffee items ordered`, total: finalPrice, status: "Pending", timestamp, customDetails: cartItems[0].customs });
      await addDoc(collection(db, "transactions"), orderPayload);
      
      setCartItems([]);
      triggerToast("Order Saved Real-time!");
      setActiveReceipt(orderPayload);
      setReceiptVisible(true);
    } catch (e) { console.error("Transaction Error: ", e); }
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}><ActivityIndicator size="large" color="#D17842" /></View>;

  const BottomNav = () => (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => setScreen('home')}><Home color={screen === 'home' ? "#D17842" : "#555"} size={24} /></TouchableOpacity>
      <TouchableOpacity onPress={() => setScreen('favorites')}><Heart color={screen === 'favorites' ? "#D17842" : "#555"} size={24} /></TouchableOpacity>
      <TouchableOpacity onPress={() => setScreen('profile')}><User color={screen === 'profile' ? "#D17842" : "#555"} size={24} /></TouchableOpacity>
    </View>
  );

  const SideDrawer = () => (
    <Modal visible={isDrawerVisible} transparent animationType="fade">
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: '75%', backgroundColor: '#1E1E1E', padding: 25, paddingTop: 60 }}>
          <TouchableOpacity onPress={() => setIsDrawerVisible(false)} style={{ marginBottom: 40 }}><X color="white" size={28} /></TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: 'rgba(209, 120, 66, 0.1)', padding: 15, borderRadius: 12 }} onPress={() => { setIsDrawerVisible(false); setScreen('profile'); }}><User color="#D17842" size={24} /><Text style={{ color: 'white', fontSize: 18, marginLeft: 15, fontWeight: 'bold' }}>Profile</Text></TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => {signOut(auth); setScreen('login'); setIsDrawerVisible(false);}} style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}><LogOut color="#ff4444" size={20} /><Text style={{ color: '#ff4444', marginLeft: 15 }}>Logout</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={{ width: '25%', backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => setIsDrawerVisible(false)} />
      </View>
    </Modal>
  );

  return (
    <View style={styles.masterRootView}>
      <SideDrawer />
      <AdminDashboard visible={adminDashboardVisible} onClose={() => setAdminDashboardVisible(false)} transactions={transactions} />
      <AdminLoginModal visible={adminWindowVisible} onClose={() => setAdminWindowVisible(false)} onVerify={handleVerifyAdminLogin} email={adminLogEmail} setEmail={setAdminLogEmail} pass={adminLogPass} setPass={setAdminLogPass} error={adminLogError} />
      <ReceiptModal visible={receiptVisible} onClose={() => { setReceiptVisible(false); setScreen('profile'); }} orderData={activeReceipt} />
      
      {toastVisible && <View style={styles.toastContainer}><CheckCircle color="white" size={20} /><Text style={styles.toastText}>{toastMessage}</Text></View>}
      
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Customize {selectedCoffee?.name}</Text><TouchableOpacity onPress={() => setIsModalVisible(false)}><X color="white" size={24} /></TouchableOpacity></View>
            <Text style={styles.optionLabel}>Size</Text>
            <View style={styles.optionGroup}>{['Small', 'Medium', 'Large'].map((s: any) => (<TouchableOpacity key={s} onPress={() => setCustomization({...customization, size: s})} style={[styles.optionBtn, customization.size === s && styles.optionBtnActive]}><Text style={[styles.optionBtnText, customization.size === s && styles.optionBtnTextActive]}>{s}</Text></TouchableOpacity>))}</View>
            <Text style={styles.optionLabel}>Sugar</Text>
            <View style={styles.optionGroup}>{['None', 'Less', 'Normal', 'Extra'].map((s: any) => (<TouchableOpacity key={s} onPress={() => setCustomization({...customization, sugar: s})} style={[styles.optionBtn, customization.sugar === s && styles.optionBtnActive]}><Text style={[styles.optionBtnText, customization.sugar === s && styles.optionBtnTextActive]}>{s}</Text></TouchableOpacity>))}</View>
            <Text style={styles.optionLabel}>Milk</Text>
            <View style={styles.optionGroup}>{['None', 'Full Cream', 'Oat Milk'].map((m: any) => (<TouchableOpacity key={m} onPress={() => setCustomization({...customization, milk: m})} style={[styles.optionBtn, customization.milk === m && styles.optionBtnActive]}><Text style={[styles.optionBtnText, customization.milk === m && styles.optionBtnTextActive]}>{m}</Text></TouchableOpacity>))}</View>
            <Text style={styles.optionLabel}>Ice</Text>
            <View style={styles.optionGroup}>{['No Ice', 'Less Ice', 'Normal', 'Extra Ice'].map((i: any) => (<TouchableOpacity key={i} onPress={() => setCustomization({...customization, ice: i})} style={[styles.optionBtn, customization.ice === i && styles.optionBtnActive]}><Text style={[styles.optionBtnText, customization.ice === i && styles.optionBtnTextActive]}>{i}</Text></TouchableOpacity>))}</View>
            <TouchableOpacity 
                style={[styles.getStartedBtn, {width: '100%', marginTop: 20}]} 
                onPress={() => {
                    const priceForSize = selectedCoffee.prices[customization.size];
                    setCartItems([...cartItems, {...selectedCoffee, price: priceForSize, cartId: Math.random(), customs: customization}]); 
                    setIsModalVisible(false); 
                    triggerToast("Added to Cart!");
                }}
            >
                <Text style={styles.btnText}>Add to Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {screen === 'splash' && (
        <ImageBackground source={require('../../assets/images/background.jpeg')} style={styles.backgroundImage} resizeMode="cover">
          <View style={styles.darkOverlay}><Text style={[styles.logoText, { fontFamily: 'Amarante', fontWeight: 'bold' }]}>Espresso Express</Text><View style={{ flex: 1 }} /><Text style={[styles.tagline, { fontFamily: 'CoffeeFont', fontWeight: 'thin', color: '#919191' }]}>Feeling Low? Take a Sip of Coffee</Text><TouchableOpacity style={styles.getStartedBtn} onPress={() => setScreen('login')}><Text style={styles.btnText}>Get Started</Text></TouchableOpacity></View>
        </ImageBackground>
      )}

      {screen === 'login' && (
        <LoginScreenView loginEmail={loginEmail} loginPassword={loginPassword} setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword} authError={authError} onLogin={async () => { try { await signInWithEmailAndPassword(auth, loginEmail, loginPassword); triggerToast("Welcome Back!"); setScreen('home'); } catch (e: any) { setAuthError(e.message); } }} onGoogleLogin={handleGoogleLogin} setScreen={setScreen} openAdminModal={() => setAdminWindowVisible(true)} />
      )}
      
      {screen === 'signup' && <SignupScreenView signupName={signupName} signupEmail={signupEmail} signupPassword={signupPassword} setSignupName={setSignupName} setSignupEmail={setSignupEmail} setSignupPassword={setSignupPassword} authError={authError} onSignup={async () => { try { const res = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword); await setDoc(doc(db, "users", res.user.uid), { fullName: signupName, email: signupEmail, createdAt: serverTimestamp() }); triggerToast("Account Created!"); setScreen('home'); } catch (e: any) { setAuthError(e.message); } }} setScreen={setScreen} />}

      {screen === 'home' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}>
            <TouchableOpacity onPress={() => setIsDrawerVisible(true)}><Menu color="white" size={24} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('cart')}><ShoppingCart color="white" size={24} />{cartItems.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartItems.length}</Text></View>}</TouchableOpacity>
          </View>
          <Text style={[styles.mainTitle, { fontFamily: 'Monsterrat', fontWeight: '100' }]}>Brain power, brewed to order.</Text>
          <View style={styles.searchBar}><Search color="#888" size={20} /><TextInput placeholder="Find your coffee" placeholderTextColor="#888" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} /></View>
          <FlatList data={coffeeItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))} numColumns={2} renderItem={({ item }) => (
            <View style={styles.coffeeCard}>
              <TouchableOpacity onPress={() => addDoc(collection(db, "favorites"), { userId: auth.currentUser?.uid, name: item.name, price: item.prices.Small, timestamp: serverTimestamp() }).then(() => triggerToast("Added to Favorites"))} style={{ position: 'absolute', right: 10, top: 10, zIndex: 1 }}><Heart color="#D17842" size={18} /></TouchableOpacity>
              <View style={styles.cardImgContainer}><Image source={item.img} style={styles.cardImg} resizeMode="contain" /></View>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.cardFooter}><Text style={styles.cardPrice}>Starts at {item.prices.Small}</Text><TouchableOpacity style={styles.plusBtn} onPress={() => { setSelectedCoffee(item); setIsModalVisible(true); }}><Plus color="white" size={16} /></TouchableOpacity></View>
            </View>
          )} />
          <BottomNav />
        </View>
      )}

      {screen === 'favorites' && (
        <View style={styles.container}>
          <Text style={[styles.mainTitle, { fontFamily: 'Amarante' }]}>Favorites</Text>
          <FlatList data={favorites} renderItem={({ item }: any) => <View style={styles.cartItemCard}><Heart color="#D17842" size={20} fill="#D17842" /><View style={{ flex: 1, marginLeft: 15 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text><Text style={{ color: '#888' }}>{item.price}</Text></View></View>} ListEmptyComponent={<Text style={{ color: '#555', textAlign: 'center' }}>No favorites yet.</Text>} />
          <BottomNav />
        </View>
      )}

      
      {screen === 'cart' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}><TouchableOpacity onPress={() => setScreen('home')}><ArrowLeft color="white" size={24} /></TouchableOpacity><Text style={{ color: 'white', fontSize: 20 }}>Cart</Text><View style={{ width: 24 }} /></View>
          
          <View style={{ flex: 1 }}>
            <FlatList data={cartItems} keyExtractor={(item) => item.cartId.toString()} renderItem={({ item }) => (
              <View style={styles.cartItemCard}>
                <Image source={item.img} style={styles.cartItemImg} />
                <View style={{ flex: 1, marginLeft: 15 }}><Text style={{ color: 'white' }}>{item.name}</Text><Text style={{ color: '#D17842', fontSize: 11 }}>{item.customs.size} | {item.customs.sugar} Sugar</Text></View>
                <Text style={{ color: 'white', marginRight: 15 }}>{item.price}</Text>
                <TouchableOpacity onPress={() => setCartItems(cartItems.filter(i => i.cartId !== item.cartId))}><Trash2 color="#ff4444" size={20} /></TouchableOpacity>
              </View>
            )} />
          </View>

          
          <View style={[styles.totalSection, { borderTopWidth: 1, borderColor: '#333', paddingTop: 10 }]}>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, marginBottom: 10 }}>Select Payment Method</Text>
            
            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
              <TouchableOpacity style={[styles.methodSelectorBtn, paymentMethod === 'CASH' && styles.methodSelectorBtnActive]} onPress={() => setPaymentMethod('CASH')}>
                <Text style={[styles.methodSelectorText, paymentMethod === 'CASH' && styles.methodSelectorTextActive]}>CASH ON COUNTER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodSelectorBtn, paymentMethod === 'GCASH' && styles.methodSelectorBtnActive]} onPress={() => setPaymentMethod('GCASH')}>
                <Text style={[styles.methodSelectorText, paymentMethod === 'GCASH' && styles.methodSelectorTextActive]}>GCASH MOBILE</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'GCASH' && (
              <View style={styles.gcashAccountInformationBox}>
                <Text style={styles.gcashInformationTitle}>GCASH Payment Route Information:</Text>
                <Text style={styles.gcashInformationAccount}>Account Holder: <Text style={{ color: 'white', fontWeight: 'bold' }}>ZARAKHIEL BAKER</Text></Text>
                <Text style={styles.gcashInformationAccount}>Number: <Text style={{ color: '#D17842', fontWeight: 'bold' }}>09102128604</Text></Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: '#888' }}>Subtotal</Text>
              <Text style={{ color: 'white' }}>₱{rawTotal}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Total</Text>
              <Text style={{ color: '#D17842', fontSize: 18, fontWeight: 'bold' }}>₱{finalPrice}</Text>
            </View>
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleCheckout}><Text style={styles.btnText}>Checkout & Print Receipt</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {screen === 'profile' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}><Text style={[styles.mainTitle, { fontFamily: 'Monsterrat', fontWeight: 'normal' }]}>Account</Text><TouchableOpacity onPress={() => {signOut(auth); setScreen('login');}}><LogOut color="#ff4444" size={24} /></TouchableOpacity></View>
          <View style={[styles.cartItemCard, { padding: 20 }]}>
            <TouchableOpacity onPress={handlePickImage}>
              <Image source={{ uri: userProfile?.profilePic || 'https://via.placeholder.com/150' }} style={{ width: 60, height: 60, borderRadius: 30 }} />
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D17842', borderRadius: 10, padding: 2 }}><Camera color="white" size={12} /></View>
            </TouchableOpacity>
            <View style={{ marginLeft: 15 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{userProfile?.fullName || auth.currentUser?.email}</Text><Text style={{ color: '#888' }}>Member</Text></View>
          </View>
          
          <View style={styles.loyaltyCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: 'white', fontFamily: 'Monsterrat' }}>Loyalty Card</Text>
              <Text style={{ color: '#D17842' }}>{completedOrders}/10 Cups</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <View key={i} style={[styles.stamp, i <= completedOrders && styles.stampActive]}>
                  {i <= completedOrders ? <Ticket color="black" size={12} /> : <Text style={{ color: '#555', fontSize: 10 }}>{i}</Text>}
                </View>
              ))}
            </View>
          </View>
          <BottomNav />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  masterRootView: { flex: 1, height: '100%', backgroundColor: '#121212' },
  screenFlexContainer: { flex: 1, width: '100%', height: '100%', justifyContent: 'center' },
  loginCardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingTop: 50, width: '100%', height: '100%' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#121212', height: '100%' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  darkOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.5)', height: '100%' },
  logoText: { color: 'white', fontSize: 50, marginTop: 50, textAlign: 'center' },
  tagline: { color: 'white', fontSize: 18, textAlign: 'center', marginBottom: 10 },
  getStartedBtn: { backgroundColor: '#D17842', paddingVertical: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 10 },
  googleBtn: { backgroundColor: '#626b79', paddingVertical: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { color: 'white', fontSize: 28, marginBottom: 10 },
  searchBar: { backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 20 },
  searchInput: { color: 'white', marginLeft: 10, flex: 1 },
  coffeeCard: { backgroundColor: '#1E1E1E', flex: 1, margin: 8, borderRadius: 20, padding: 12 },
  subTitle: { fontSize: 16, color: '#b4b4b4', marginBottom: 16, lineHeight: 22 },
  cardImgContainer: { width: '50%', marginLeft: '25%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000' },
  cardImg: { width: '100%', height: '100%' },
  cardName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  cardPrice: { color: 'white', fontWeight: 'bold' },
  plusBtn: { backgroundColor: '#D17842', padding: 6, borderRadius: 8 },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#121212', position: 'absolute', bottom: 0, left: 0, right: 0 },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: '#D17842', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
  cartItemCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  cartItemImg: { width: 50, height: 50, borderRadius: 10 },
  totalSection: { paddingVertical: 10 },
  inputGroup: { backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 15, width: '100%' },
  authInput: { color: 'white', marginLeft: 10, flex: 1 },
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#D17842', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  toastText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  
  
  methodSelectorBtn: { flex: 1, backgroundColor: '#1E1E1E', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  methodSelectorBtnActive: { borderColor: '#D17842', backgroundColor: 'rgba(209,120,66,0.1)' },
  methodSelectorText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  methodSelectorTextActive: { color: '#D17842' },
  gcashAccountInformationBox: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  gcashInformationTitle: { color: '#D17842', fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  gcashInformationAccount: { color: '#AAA', fontSize: 13, marginTop: 2 },

  
  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  receiptContainer: { width: Platform.OS === 'web' ? 420 : '88%', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 4, shadowColor: '#000', shadowRadius: 10 },
  receiptHeader: { alignItems: 'center', marginBottom: 15 },
  receiptBrand: { fontSize: 22, fontWeight: '900', color: '#121212', letterSpacing: 1 },
  receiptSub: { color: '#666', fontSize: 12, marginTop: 2 },
  receiptDivider: { color: '#888', letterSpacing: 2, marginVertical: 4 },
  receiptBodyRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  receiptLabel: { color: '#555', fontWeight: '700', fontSize: 13 },
  receiptValue: { color: '#121212', fontWeight: 'bold', fontSize: 13 },
  receiptItemLine: { marginVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  receiptItemName: { fontSize: 14, fontWeight: 'bold', color: '#121212' },
  receiptItemDetails: { fontSize: 11, color: '#666', marginTop: 1 },
  receiptItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#121212' },
  receiptFooter: { textAlign: 'center', color: '#666', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  receiptCloseBtn: { backgroundColor: '#121212', paddingVertical: 12, borderRadius: 4, alignItems: 'center', marginTop: 25 },
  receiptCloseBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121212', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 2, borderTopColor: '#333', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 20 },
  optionLabel: { color: '#888', marginBottom: 10, marginTop: 10 },
  optionGroup: { flexDirection: 'row', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  optionBtnActive: { borderColor: '#D17842', backgroundColor: 'rgba(209, 120, 66, 0.1)' },
  optionBtnText: { color: '#888', fontSize: 11 },
  optionBtnTextActive: { color: '#D17842', fontWeight: 'bold' },
  loyaltyCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#333' },
  stamp: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  stampActive: { backgroundColor: '#D17842' },

  adminHeaderTrigger: { borderBottomWidth: 1.5, borderColor: '#D17842', paddingHorizontal: 8, paddingVertical: 4 },
  adminHeaderTriggerText: { color: '#D17842', fontWeight: 'bold', fontSize: 15 },
  adminLogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  adminLogWindow: { width: Platform.OS === 'web' ? 400 : '85%', backgroundColor: '#030303', borderRadius: 12, padding: 30 },
  adminLogTitle: { fontSize: 24, color: '#121212', fontWeight: 'bold' },
  adminLogSubtitle: { color: '#666', fontSize: 14, marginBottom: 25, marginTop: 4 },
  inlineLabel: { color: '#333', fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5 },
  cleanUnderlineInput: { borderBottomWidth: 1, borderColor: '#DDD', paddingVertical: 6, fontSize: 15, color: '#121212', marginBottom: 10 },
  purpleLogButton: { backgroundColor: '#D17842', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 30 },

  adminModalContainer: { flex: 1, backgroundColor: '#646161', flexDirection: 'row', height: '100%' },
  adminSidebar: { width: '18%', backgroundColor: '#000000', padding: 20, borderRightWidth: 1, borderColor: '#EADFD7', gap: 8 },
  adminLogo: { fontSize: 28, fontWeight: 'bold', color: '#A2958B', marginBottom: 35, paddingLeft: 10 },
  adminSideTabActive: { backgroundColor: '#EADFD7', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12 },
  adminSideTabTextActive: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
  adminSideTab: { paddingVertical: 12, paddingHorizontal: 15 },
  adminSideTabText: { color: '#A2958B', fontSize: 14 },
  adminMainContent: { flex: 1, padding: 35 },
  adminHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  adminWelcomeTitle: { fontSize: 26, fontWeight: 'bold', color: '#000000', fontFamily: 'Amarante' },
  adminWelcomeSub: { color: '#A2958B', fontSize: 14, marginTop: 4 },
  adminCloseButton: { backgroundColor: '#EADFD7', padding: 10, borderRadius: 50 },
  adminKpiRow: { flexDirection: 'row', gap: 20, marginBottom: 35 },
  adminKpiCard: { flex: 1, backgroundColor: '#A2958B', padding: 22, borderRadius: 20 },
  adminKpiLabel: { color: '#000000', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  adminKpiValue: { fontSize: 24, fontWeight: 'bold', color: '#121212' },
  adminTableContainer: { flex: 1, backgroundColor: '#A2958B', padding: 25, borderRadius: 24 },
  adminTableTitle: { fontSize: 18, fontWeight: 'bold', color: '#020202', marginBottom: 20 },
  adminTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F5EFEA', alignItems: 'center' },
  adminTableTextId: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  adminTableTextItems: { color: '#A2958B', fontSize: 14, fontWeight: 'bold' },
  adminTableTextAmount: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  adminTableTextStatus: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
  adminEmptyText: { color: '#000000', textAlign: 'center', marginTop: 30, fontSize: 14 },

  paymentTableHeader: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, backgroundColor: '#b6aca7', borderRadius: 8, marginBottom: 10 },
  paymentHeaderCell: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  paymentTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#F5EFEA', alignItems: 'center' },
  paymentRowCell: { fontSize: 14, color: '#121212' },
  paymentTimeText: { color: '#000000', fontWeight: '500' },
  paymentIdText: { fontWeight: '600', color: '#121212' },
  paymentCoffeeNameText: { fontWeight: 'bold', color: '#121212', fontSize: 14 },
  paymentCoffeeCustomText: { color: '#4b4745', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  paymentAmountText: { fontWeight: 'bold', color: '#121212' },
  
  
  methodGcashBadge: { backgroundColor: 'rgba(0, 122, 255, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  methodGcashText: { color: '#0e2033', fontWeight: 'bold', fontSize: 15 },
  methodCashBadge: { backgroundColor: 'rgba(75, 181, 67, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  methodCashText: { color: '#000000', fontWeight: 'bold', fontSize: 15 }
});