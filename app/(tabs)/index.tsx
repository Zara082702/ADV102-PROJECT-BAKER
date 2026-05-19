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

function LoginScreenView({ loginEmail, loginPassword, setLoginEmail, setLoginPassword, authError, onLogin, onGoogleLogin, setScreen }: any) {
  return (
    <ImageBackground source={require('../../assets/images/background2.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <TouchableOpacity onPress={() => setScreen('splash')} style={{ marginBottom: 20 }}><ArrowLeft color="white" size={24} /></TouchableOpacity>
        <Text style={[styles.mainTitle, { fontFamily: 'Amarante', fontWeight: 'condensedBold' }]}>Welcome</Text>
        <Text style={[styles.subTitle, { fontFamily: 'CoffeeFont', fontWeight: '100', color: '#919191' }]}>Ready for your caffeine fix?</Text>
        <View style={styles.inputGroup}><Mail color="#D17842" size={20} /><TextInput placeholder="Email Address" placeholderTextColor="#888" style={styles.authInput} value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" /></View>
        <View style={styles.inputGroup}><Lock color="#D17842" size={20} /><TextInput placeholder="Password" placeholderTextColor="#888" secureTextEntry style={styles.authInput} value={loginPassword} onChangeText={setLoginPassword} /></View>
        {!!authError && <Text style={{ color: '#ff6666', marginBottom: 10 }}>{authError}</Text>}
        <TouchableOpacity style={styles.getStartedBtn} onPress={onLogin}><Text style={styles.btnText}>Login</Text></TouchableOpacity>
        <TouchableOpacity style={styles.googleBtn} onPress={onGoogleLogin}><Chrome color="white" size={20} /><Text style={[styles.btnText, { marginLeft: 10, fontSize: 16 }]}>Continue with Google</Text></TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setScreen('signup')}><Text style={{ color: '#888', fontFamily: 'Amarante', fontWeight: 'bold' }}>Sign up to Avail our Loyalty Discount
        <Text style={{ color: '#D17842', fontWeight: 'bold', fontFamily: 'Montserrat' }}> Sign Up</Text></Text></TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function SignupScreenView({ signupName, signupEmail, signupPassword, setSignupName, setSignupEmail, setSignupPassword, authError, onSignup, setScreen }: any) {
  return (
    <ImageBackground source={require('../../assets/images/background2.jpg')} style={styles.backgroundImage} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <TouchableOpacity onPress={() => setScreen('login')} style={{ marginBottom: 20 }}><ArrowLeft color="white" size={24} /></TouchableOpacity>
        <Text style={[styles.mainTitle, { fontFamily: 'Amarante', fontWeight: '100' }]}>Register to get your member discount </Text>
        <View style={styles.inputGroup}><User color="#D17842" size={20} /><TextInput placeholder="Full Name" placeholderTextColor="#888" style={styles.authInput} value={signupName} onChangeText={setSignupName} /></View>
        <View style={styles.inputGroup}><Mail color="#D17842" size={20} /><TextInput placeholder="Email" placeholderTextColor="#888" style={styles.authInput} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" /></View>
        <View style={styles.inputGroup}><Lock color="#D17842" size={20} /><TextInput placeholder="Password" placeholderTextColor="#888" secureTextEntry style={styles.authInput} value={signupPassword} onChangeText={setSignupPassword} /></View>
        {!!authError && <Text style={{ color: '#ff6666', marginBottom: 10 }}>{authError}</Text>}
        <TouchableOpacity style={styles.getStartedBtn} onPress={onSignup}><Text style={styles.btnText}>Sign Up</Text></TouchableOpacity>
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
  const [customization, setCustomization] = useState<CoffeeCustomization>({ 
    size: 'Medium', sugar: 'Normal', milk: 'Full Cream', ice: 'Normal' 
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow gallery access to update your profile.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        const userDocRef = doc(db, "users", auth.currentUser!.uid);
        await updateDoc(userDocRef, {
          profilePic: base64String 
        });
        triggerToast("Firestore updated successfully!");
      } catch (error) {
        console.error("Error updating Firestore:", error);
        triggerToast("Failed to save image.");
      }
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
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'CoffeeFont': require('../../assets/fonts/Pacifico-Regular (1).ttf'),
          'ItalicCoffeeFont': require('../../assets/fonts/FoodBrandDemo-Regular.otf'),
        });
        setFontsLoaded(true);
      } catch (e) { setFontsLoaded(true); }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userUnsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => setUserProfile(doc.data()));
    const qHistory = query(collection(db, "userHistory"), where("userId", "==", auth.currentUser.uid));
    const historyUnsub = onSnapshot(qHistory, (snapshot) => setPurchaseHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const qFavs = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
    const favsUnsub = onSnapshot(qFavs, (snapshot) => setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const qTrans = query(collection(db, "transactions"), where("userId", "==", auth.currentUser.uid));
    const transUnsub = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { userUnsub(); historyUnsub(); favsUnsub(); transUnsub(); };
  }, [auth.currentUser]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), { fullName: user.displayName, email: user.email, profilePic: user.photoURL, createdAt: serverTimestamp() }, { merge: true });
      triggerToast(`Welcome ${user.displayName}!`);
      setScreen('home');
    } catch (error: any) { setAuthError(error.message); }
  };

  const completedOrders = purchaseHistory.filter(o => o.status === 'Completed').length;
  const rawTotal = cartItems.reduce((sum, i) => sum + parseInt(i.price.replace(/[^0-9]/g, '')), 0);
  let discountPercent = 0;
  if (completedOrders === 4) discountPercent = 0.20; 
  if (completedOrders === 9) discountPercent = 0.50; 
  const finalPrice = rawTotal - (rawTotal * discountPercent);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    try {
      const userId = auth.currentUser?.uid;
      const transactionId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = serverTimestamp();

      await addDoc(collection(db, "userHistory"), { 
        userId, transactionId, summary: `${cartItems.length} items ordered`, 
        total: finalPrice, 
        status: "Pending", timestamp,
        customDetails: cartItems[0].customs
      });

      await addDoc(collection(db, "transactions"), {
        userId,
        transactionId,
        items: cartItems.map(item => ({
          name: item.name,
          price: item.price,
          customs: item.customs
        })),
        totalAmount: finalPrice,
        status: "Success",
        timestamp
      });

      setCartItems([]);
      triggerToast(discountPercent > 0 ? "Discount Applied! Order Placed" : "Order Placed Successfully!");
      setScreen('profile');
    } catch (e) { 
      console.error("Transaction Error: ", e);
    }
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
          <TouchableOpacity onPress={() => setIsDrawerVisible(false)} style={{ marginBottom: 40 }}>
            <X color="white" size={28} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: 'rgba(209, 120, 66, 0.1)', padding: 15, borderRadius: 12 }}
            onPress={() => { setIsDrawerVisible(false); setIsDashboardVisible(true); }}
          >
            <User color="#D17842" size={24} />
            <Text style={{ color: 'white', fontSize: 18, marginLeft: 15, fontWeight: 'bold' }}>Profile</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => {signOut(auth); setScreen('login'); setIsDrawerVisible(false);}} style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}>
            <LogOut color="#ff4444" size={20} />
            <Text style={{ color: '#ff4444', marginLeft: 15 }}>Logout</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={{ width: '25%', backgroundColor: 'rgba(0,0,0,0.6)' }} 
          onPress={() => setIsDrawerVisible(false)} 
        />
      </View>
    </Modal>
  );

  const ProfileDashboard = () => (
    <Modal visible={isDashboardVisible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#1E1E1E', width: '100%', borderRadius: 25, padding: 20, maxHeight: '90%', borderWidth: 1, borderColor: '#333' }}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontWeight: 'bold', fontFamily: 'Monsterrat' }]}>Dashboard</Text>
            <TouchableOpacity onPress={() => setIsDashboardVisible(false)}><X color="white" size={24} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: '#121212', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={handlePickImage} style={{ marginBottom: 15 }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, borderStyle: 'dashed', borderWidth: 2, borderColor: '#D17842', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {userProfile?.profilePic ? (
                        <Image source={{ uri: userProfile.profilePic }} style={{ width: 100, height: 100 }} />
                    ) : (
                        <Camera color="#D17842" size={30} />
                    )}
                </View>
              </TouchableOpacity>
              <View style={{ width: '100%', marginTop: 20, gap: 10 }}>
                 <TextInput style={{ color: 'white', borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8 }} value={userProfile?.fullName} editable={false} />
                 <TextInput style={{ color: 'white', borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8 }} value={userProfile?.email} editable={false} />
              </View>
            </View>
            <View style={{ backgroundColor: '#121212', borderRadius: 15, padding: 15, marginBottom: 15 }}>
               <Text style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Monsterrat', marginBottom: 10 }}>My Account</Text>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#888', fontSize: 12, }}>Active Account</Text>
                    <Text style={{ color: 'white', fontSize: 14, }}>8040 5000 8928 4525</Text>
                  </View>
                  <TouchableOpacity style={{ backgroundColor: '#ff4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontSize: 10 }}>Block</Text>
                  </TouchableOpacity>
               </View>
            </View>
            <TouchableOpacity style={[styles.getStartedBtn, { marginTop: 25 }]} onPress={() => setIsDashboardVisible(false)}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <SideDrawer />
      <ProfileDashboard />
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
                    triggerToast("Great Choice! Added to Cart");
                }}
            >
                <Text style={styles.btnText}>Add to Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {screen === 'splash' && (
        <ImageBackground source={require('../../assets/images/background.jpeg')} style={styles.backgroundImage} resizeMode="cover">
          <View style={styles.darkOverlay}><Text style={[styles.logoText, { fontFamily: 'Amarante', fontWeight: 'condensedBold' }]}>Espresso Express</Text><View style={{ flex: 1 }} /><Text style={[styles.tagline, { fontFamily: 'CoffeeFont', fontWeight: 'thin', color: '#919191' }]}>Feeling Low? Take a Sip of Coffee</Text><TouchableOpacity style={styles.getStartedBtn} onPress={() => setScreen('login')}><Text style={styles.btnText}>Get Started</Text></TouchableOpacity></View>
        </ImageBackground>
      )}

      {screen === 'login' && <LoginScreenView loginEmail={loginEmail} loginPassword={loginPassword} setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword} authError={authError} onLogin={async () => { try { await signInWithEmailAndPassword(auth, loginEmail, loginPassword); triggerToast("Welcome Back!"); setScreen('home'); } catch (e: any) { setAuthError(e.message); } }} onGoogleLogin={handleGoogleLogin} setScreen={setScreen} />}
      {screen === 'signup' && <SignupScreenView signupName={signupName} signupEmail={signupEmail} signupPassword={signupPassword} setSignupName={setSignupName} setSignupEmail={setSignupEmail} setSignupPassword={setSignupPassword} authError={authError} onSignup={async () => { try { const res = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword); await setDoc(doc(db, "users", res.user.uid), { fullName: signupName, email: signupEmail, createdAt: serverTimestamp() }); triggerToast("Account Created!"); setScreen('home'); } catch (e: any) { setAuthError(e.message); } }} setScreen={setScreen} />}
      
      {screen === 'home' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}>
            <TouchableOpacity onPress={() => setIsDrawerVisible(true)}><Menu color="white" size={24} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('cart')}>
              <ShoppingCart color="white" size={24} />
              {cartItems.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartItems.length}</Text></View>}
            </TouchableOpacity>
          </View>
          <Text style={[styles.mainTitle, { fontFamily: 'Monsterrat', fontWeight: '100' }]}>Brain power, brewed to order.</Text>
          <View style={styles.searchBar}><Search color="#888" size={20} /><TextInput placeholder="Find your coffee" placeholderTextColor="#888" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} /></View>
          <FlatList 
            data={coffeeItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))} 
            numColumns={2} 
            renderItem={({ item }) => (
              <View style={styles.coffeeCard}>
                <TouchableOpacity onPress={() => addDoc(collection(db, "favorites"), { userId: auth.currentUser?.uid, name: item.name, price: item.prices.Small, timestamp: serverTimestamp() }).then(() => triggerToast("Great Choice! Added to Favorites"))} style={{ position: 'absolute', right: 10, top: 10, zIndex: 1 }}><Heart color="#D17842" size={18} /></TouchableOpacity>
                <View style={styles.cardImgContainer}>
                    <Image source={item.img} style={styles.cardImg} resizeMode="contain" />
                </View>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.cardFooter}><Text style={styles.cardPrice}>Starts at {item.prices.Small}</Text><TouchableOpacity style={styles.plusBtn} onPress={() => { setSelectedCoffee(item); setIsModalVisible(true); }}><Plus color="white" size={16} /></TouchableOpacity></View>
              </View>
            )} 
          />
          <BottomNav />
        </View>
      )}

      {screen === 'profile' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}><Text style={[styles.mainTitle, { fontFamily: 'Monsterrat', fontWeight: 'light' }]}>Account</Text><TouchableOpacity onPress={() => {signOut(auth); setScreen('login');}}><LogOut color="#ff4444" size={24} /></TouchableOpacity></View>
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
            <Text style={{ color: '#888', fontSize: 11, marginTop: 10 }}>*Get discounts on your 5th & 10th coffee purchase!</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 18, marginTop: 20, marginBottom: 10, fontWeight: 'bold', fontFamily: 'Monsterrat' }}>Orders</Text>
          <FlatList data={purchaseHistory} keyExtractor={(item: any) => item.id} renderItem={({ item }: any) => (
            <View style={styles.cartItemCard}>
              <View style={{ flex: 1 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{item.transactionId}</Text><Text style={{ color: item.status === 'Cancelled' ? '#ff4444' : '#D17842' }}>{item.status}</Text></View>
              {item.status === 'Pending' && (
                <View style={{flexDirection: 'row', gap: 10}}>
                   <TouchableOpacity onPress={() => updateDoc(doc(db, "userHistory", item.id), { status: "Cancelled" })}><X color="#ff4444" size={20} /></TouchableOpacity>
                   <TouchableOpacity onPress={() => updateDoc(doc(db, "userHistory", item.id), { status: "Completed" })}><CheckCircle color="#4BB543" size={20} /></TouchableOpacity>
                </View>
              )}
            </View>
          )} />
          <BottomNav />
        </View>
      )}

      {screen === 'favorites' && (
        <View style={styles.container}>
          <Text style={[styles.mainTitle, { fontFamily: 'CoffeeFont' }]}>Favorites</Text>
          <FlatList data={favorites} renderItem={({ item }: any) => <View style={styles.cartItemCard}><Heart color="#D17842" size={20} fill="#D17842" /><View style={{ flex: 1, marginLeft: 15 }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text><Text style={{ color: '#888' }}>{item.price}</Text></View></View>} ListEmptyComponent={<Text style={{ color: '#555', textAlign: 'center' }}>No favorites yet.</Text>} />
          <BottomNav />
        </View>
      )}

      {screen === 'cart' && (
        <View style={styles.container}>
          <View style={styles.homeHeader}><TouchableOpacity onPress={() => setScreen('home')}><ArrowLeft color="white" size={24} /></TouchableOpacity><Text style={{ color: 'white', fontSize: 20 }}>Cart</Text><View style={{ width: 24 }} /></View>
          <FlatList data={cartItems} renderItem={({ item }) => (
            <View style={styles.cartItemCard}>
              <Image source={item.img} style={styles.cartItemImg} />
              <View style={{ flex: 1, marginLeft: 15 }}><Text style={{ color: 'white' }}>{item.name}</Text><Text style={{ color: '#D17842', fontSize: 11 }}>{item.customs.size} | {item.customs.sugar} Sugar</Text></View>
              <Text style={{ color: 'white', marginRight: 15 }}>{item.price}</Text>
              <TouchableOpacity onPress={() => setCartItems(cartItems.filter(i => i.cartId !== item.cartId))}><Trash2 color="#ff4444" size={20} /></TouchableOpacity>
            </View>
          )} />
          <View style={styles.totalSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: '#888' }}>Subtotal</Text>
              <Text style={{ color: 'white' }}>₱{rawTotal}</Text>
            </View>
            {discountPercent > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ color: '#D17842' }}>Loyalty Discount ({discountPercent * 100}%)</Text>
                <Text style={{ color: '#D17842' }}>-₱{rawTotal * discountPercent}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Total</Text>
              <Text style={{ color: '#D17842', fontSize: 18, fontWeight: 'bold' }}>₱{finalPrice}</Text>
            </View>
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleCheckout}><Text style={styles.btnText}>Checkout</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#121212' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  darkOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.5)' },
  logoText: { color: 'white', fontSize: 50, marginTop: 50, textAlign: 'center' },
  tagline: { color: 'white', fontSize: 18, textAlign: 'center', marginBottom: 10 },
  getStartedBtn: { backgroundColor: '#D17842', paddingVertical: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 20 },
  googleBtn: { backgroundColor: '#626b79', paddingVertical: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { color: 'white', fontSize: 28, fontWeight: '100', marginBottom: 10 },
  searchBar: { backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 20 },
  searchInput: { color: 'white', marginLeft: 10, flex: 1 },
  coffeeCard: { backgroundColor: '#1E1E1E', flex: 1, margin: 8, borderRadius: 20, padding: 12 },
  subTitle: { fontSize: 16, color: '#b4b4b4', marginBottom: 16, lineHeight: 22, },
  cardImgContainer: { width: '50%', marginLeft: '25%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', },
  cardImg: { width: '100%', height: '100%', },
  cardName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  cardPrice: { color: 'white', fontWeight: 'bold' },
  plusBtn: { backgroundColor: '#D17842', padding: 6, borderRadius: 8 },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#121212' },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: '#D17842', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
  cartItemCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  cartItemImg: { width: 50, height: 50, borderRadius: 10 },
  totalSection: { borderTopWidth: 1, borderTopColor: '#333', paddingVertical: 20 },
  inputGroup: { backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 15, width: '100%' },
  authInput: { color: 'white', marginLeft: 10, flex: 1 },
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#D17842', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  toastText: { color: 'white', fontWeight: 'bold', fontFamily: 'Sans-Serif', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121212', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 2, borderTopColor: '#333', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'thin' },
  optionLabel: { color: '#888', marginBottom: 10, marginTop: 10 },
  optionGroup: { flexDirection: 'row', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  optionBtnActive: { borderColor: '#D17842', backgroundColor: 'rgba(209, 120, 66, 0.1)' },
  optionBtnText: { color: '#888', fontSize: 11 },
  optionBtnTextActive: { color: '#D17842', fontWeight: 'bold' },
  loyaltyCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#333' },
  stamp: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  stampActive: { backgroundColor: '#D17842' }
});