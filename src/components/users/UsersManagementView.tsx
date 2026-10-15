import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Key, 
  Check, 
  X, 
  Eye, 
  Plus, 
  PenTool, 
  RotateCcw, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles,
  Shield,
  Code2,
  UserCog,
  Sprout,
  Users2,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../locales/i18nContext';
import { 
  AppUser, 
  UserRole, 
  SYSTEM_FEATURES, 
  FeaturePermission, 
  PermissionAction,
  DEFAULT_ROLE_PERMISSIONS 
} from '../../types/auth';

const ROLE_BADGE_CONFIG: Record<UserRole, {
  labelEn: string;
  labelKm: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.FC<{ className?: string }>;
  descriptionEn: string;
  descriptionKm: string;
}> = {
  developer: {
    labelEn: 'Developer',
    labelKm: 'អ្នកអភិវឌ្ឍន៍ (Developer)',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Code2,
    descriptionEn: 'Full control over all features, settings and codebase.',
    descriptionKm: 'សិទ្ធិពេញលេញលើគ្រប់មុខងារ ការកំណត់ និងប្រព័ន្ធទាំងមូល។',
  },
  admin: {
    labelEn: 'Admin',
    labelKm: 'រដ្ឋបាល (Admin)',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: UserCog,
    descriptionEn: 'Full control over all features except Project Quotation (A4).',
    descriptionKm: 'សិទ្ធិពេញលេញលើគ្រប់មុខងារ លើកលែងតែសម្រង់តម្លៃគម្រោង (A4)។',
  },
  farmer: {
    labelEn: 'Farmers',
    labelKm: 'កសិករ (Farmers)',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Sprout,
    descriptionEn: 'View, add, edit control across features except Project. No delete permission.',
    descriptionKm: 'សិទ្ធិមើល បន្ថែម កែសម្រួលគ្រប់មុខងារ លើកលែង Project (គ្មានសិទ្ធិលុប)។',
  },
  team: {
    labelEn: 'Team',
    labelKm: 'ក្រុមការងារ (Team)',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Users2,
    descriptionEn: 'View, add, edit control across features except Project. No delete permission.',
    descriptionKm: 'សិទ្ធិមើល បន្ថែម កែសម្រួលគ្រប់មុខងារ លើកលែង Project (គ្មានសិទ្ធិលុប)។',
  },
};

export const UsersManagementView: React.FC = () => {
  const { language } = useI18n();
  const { 
    currentUser, 
    users, 
    rolePermissions, 
    switchUser, 
    addUser, 
    updateUser, 
    deleteUser,
    updateRolePermission,
    batchUpdateRolePermissions,
    resetRolePermissionsToDefault,
    canAdd,
    canEdit,
    canDelete
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'permissions' | 'guide'>('users');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<UserRole>('developer');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // User Form State
  const [formName, setFormName] = useState('');
  const [formNameKm, setFormNameKm] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formRole, setFormRole] = useState<UserRole>('farmer');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const showNotification = (msg: string) => {
    setSaveSuccessNotification(msg);
    setTimeout(() => setSaveSuccessNotification(null), 3000);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormNameKm('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('123');
    setFormRole('farmer');
    setFormPhone('');
    setFormDepartment('Farm Operations');
    setFormStatus('active');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormNameKm(user.nameKm || '');
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword(user.password || '123');
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setFormDepartment(user.department || '');
    setFormStatus(user.status);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim()) return;

    if (editingUser) {
      await updateUser(editingUser.id, {
        name: formName.trim(),
        nameKm: formNameKm.trim() || undefined,
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim() || '123',
        role: formRole,
        phone: formPhone.trim(),
        department: formDepartment.trim(),
        status: formStatus,
      });
      showNotification(language === 'km' ? 'បានកែសម្រួលគណនីជោគជ័យ' : 'User account updated successfully');
    } else {
      await addUser({
        name: formName.trim(),
        nameKm: formNameKm.trim() || undefined,
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim().toLowerCase() || `${formUsername.trim().toLowerCase()}@melonpro.com`,
        password: formPassword.trim() || '123',
        role: formRole,
        phone: formPhone.trim(),
        department: formDepartment.trim() || 'Field Operations',
        status: formStatus,
      });
      showNotification(language === 'km' ? 'បានបន្ថែមអ្នកប្រើប្រាស់ថ្មីជោគជ័យ' : 'New user created successfully');
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(language === 'km' ? `តើអ្នកប្រាកដជាចង់លុបគណនី «${userName}» មែនទេ?` : `Are you sure you want to delete user "${userName}"?`)) {
      try {
        await deleteUser(userId);
        showNotification(language === 'km' ? 'បានលុបគណនីជោគជ័យ' : 'User deleted successfully');
      } catch (err: any) {
        alert(err?.message || 'Failed to delete user');
      }
    }
  };

  // Toggle single action permission
  const handleTogglePermission = (featureId: string, action: PermissionAction) => {
    const currentVal = rolePermissions[selectedRoleForMatrix]?.[featureId]?.[action] ?? false;
    updateRolePermission(selectedRoleForMatrix, featureId, action, !currentVal);
  };

  // Toggle all 4 actions for a feature row
  const handleToggleRowAll = (featureId: string) => {
    const current = rolePermissions[selectedRoleForMatrix]?.[featureId] || { view: false, add: false, edit: false, delete: false };
    const allEnabled = current.view && current.add && current.edit && current.delete;
    const nextVal = !allEnabled;

    updateRolePermission(selectedRoleForMatrix, featureId, 'view', nextVal);
    updateRolePermission(selectedRoleForMatrix, featureId, 'add', nextVal);
    updateRolePermission(selectedRoleForMatrix, featureId, 'edit', nextVal);
    updateRolePermission(selectedRoleForMatrix, featureId, 'delete', nextVal);
  };

  // Bulk action across all features for selected role
  const handleBulkAction = (action: PermissionAction | 'all', value: boolean) => {
    const currentMap = { ...(rolePermissions[selectedRoleForMatrix] || {}) };
    SYSTEM_FEATURES.forEach((feat) => {
      const featPerm = currentMap[feat.id] ? { ...currentMap[feat.id] } : { view: false, add: false, edit: false, delete: false };
      if (action === 'all') {
        featPerm.view = value;
        featPerm.add = value;
        featPerm.edit = value;
        featPerm.delete = value;
      } else {
        featPerm[action] = value;
      }
      currentMap[feat.id] = featPerm;
    });
    batchUpdateRolePermissions(selectedRoleForMatrix, currentMap);
    showNotification(language === 'km' ? 'បានកែប្រែសិទ្ធិទាំងអស់' : 'Updated permissions for selected role');
  };

  const handleResetRoleDefaults = () => {
    if (confirm(language === 'km' ? `តើអ្នកចង់កំណត់សិទ្ធិរបស់ «${ROLE_BADGE_CONFIG[selectedRoleForMatrix].labelKm}» ទៅតាមលំនាំដើមវិញទេ?` : `Reset permissions for "${ROLE_BADGE_CONFIG[selectedRoleForMatrix].labelEn}" to default?`)) {
      resetRolePermissionsToDefault(selectedRoleForMatrix);
      showNotification(language === 'km' ? 'បានកំណត់ទៅសិទ្ធិលំនាំដើមវិញ' : 'Reset role permissions to default');
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nameKm && u.nameKm.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className={`space-y-6 ${language === 'km' ? 'font-khmer' : ''}`}>
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#164e22] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2.5">
                <span>{language === 'km' ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់ & សិទ្ធិ' : 'Users & Permission Management'}</span>
                <span className="shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 shadow-2xs">
                  RBAC Matrix
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km' 
                  ? 'កំណត់សិទ្ធិមើល (View) បន្ថែម (Add) កែសម្រួល (Edit) លុប (Delete) តាមតួនាទី និងគ្រប់គ្រងគណនីប្រតិបត្តិការចំការ' 
                  : 'Dynamic role-based access control (View, Add, Edit, Delete) across all farm features and operators.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Add User */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'km' ? '+ បន្ថែមអ្នកប្រើប្រាស់ថ្មី' : '+ Add New User'}</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      <AnimatePresence>
        {saveSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg border border-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{saveSuccessNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>{language === 'km' ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users'}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
          <span className="text-[11px] text-slate-400">{users.filter((u) => u.status === 'active').length} {language === 'km' ? 'សកម្ម' : 'active'}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs font-semibold mb-1">
            <span>Developer</span>
            <Code2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-950">
            {users.filter((u) => u.role === 'developer').length}
          </p>
          <span className="text-[11px] text-indigo-700 font-medium">Full Control</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-semibold mb-1">
            <span>Admin</span>
            <UserCog className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-950">
            {users.filter((u) => u.role === 'admin').length}
          </p>
          <span className="text-[11px] text-blue-700 font-medium">All except Quotation</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold mb-1">
            <span>Farmers & Team</span>
            <Sprout className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-950">
            {users.filter((u) => u.role === 'farmer' || u.role === 'team').length}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">View, Add, Edit</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'បញ្ជីអ្នកប្រើប្រាស់ (Users Directory)' : 'Users Directory'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'permissions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'កំណត់សិទ្ធិតាមតួនាទី (Permissions Matrix)' : 'Role Permissions Matrix'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'guide'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'គោលការណ៍សិទ្ធិ (Role Policy Guide)' : 'Role Policy Guide'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: USERS DIRECTORY                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល គណនី...' : 'Search by name, email, username...'}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Role:</span>
              </span>
              {(['all', 'developer', 'admin', 'farmer', 'team'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#164e22] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? (language === 'km' ? 'ទាំងអស់' : 'All') : r}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">{language === 'km' ? 'អ្នកប្រើប្រាស់' : 'User'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'គណនី / អ៊ីមែល' : 'Username & Email'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'តួនាទី (Role)' : 'Role'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'សេចក្តីសង្ខេបសិទ្ធិ' : 'Permissions Scope'}</th>
                    <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((user) => {
                    const roleConfig = ROLE_BADGE_CONFIG[user.role];
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelf ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#164e22] text-white flex items-center justify-center font-bold text-sm shadow-2xs ring-2 ring-emerald-500/20 shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5 truncate">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    YOU
                                  </span>
                                )}
                              </p>
                              {user.nameKm && (
                                <p className="text-[11px] text-slate-400 font-khmer truncate">
                                  {user.nameKm}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 truncate">
                                {user.department || 'Field Operations'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Username & Email */}
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-slate-800 text-xs">
                            @{user.username}
                          </p>
                          <p className="text-slate-500 text-[11px] font-mono">
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-slate-400 text-[10px]">
                              {user.phone}
                            </p>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${roleConfig.bgColor} ${roleConfig.color} ${roleConfig.borderColor}`}>
                            <roleConfig.icon className="w-3.5 h-3.5" />
                            <span>{language === 'km' ? roleConfig.labelKm : roleConfig.labelEn}</span>
                          </span>
                        </td>

                        {/* Permissions Scope */}
                        <td className="py-3.5 px-4">
                          {user.role === 'developer' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              Full Control (All Features)
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              Full Control (Except Quotation A4)
                            </span>
                          )}
                          {user.role === 'farmer' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              View, Add, Edit (No Delete · No Project)
                            </span>
                          )}
                          {user.role === 'team' && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              View, Add, Edit (No Delete · No Project)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span className="capitalize">{user.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Switch to this user button */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  switchUser(user.id);
                                  showNotification(language === 'km' ? `បានប្តូរទៅកាន់គណនី ${user.name}` : `Switched to user ${user.name}`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Login as this user"
                              >
                                <Key className="w-3 h-3 text-emerald-600" />
                                <span>Switch</span>
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit user"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ROLE PERMISSIONS MATRIX (DYNAMIC CONFIGURATION)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-4">
          {/* Role Selector Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {language === 'km' ? 'ជ្រើសរើសតួនាទីដើម្បីកំណត់សិទ្ធិ (Select Role):' : 'Select Role to Configure Permissions:'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {(['developer', 'admin', 'farmer', 'team'] as const).map((r) => {
                    const cfg = ROLE_BADGE_CONFIG[r];
                    const isSelected = selectedRoleForMatrix === r;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoleForMatrix(r)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} ring-2 ring-emerald-500/20 shadow-xs`
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <cfg.icon className="w-4 h-4" />
                        <span>{language === 'km' ? cfg.labelKm : cfg.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetRoleDefaults}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset role to default specification"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'km' ? 'កំណត់លំនាំដើម' : 'Reset to Defaults'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => showNotification(language === 'km' ? 'បានរក្សាទុកសិទ្ធិជោគជ័យ' : 'Permissions saved successfully')}
                  className="px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'រក្សាទុកសិទ្ធិ' : 'Save Matrix'}</span>
                </button>
              </div>
            </div>

            {/* Role Policy Summary Banner */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 ${ROLE_BADGE_CONFIG[selectedRoleForMatrix].bgColor} ${ROLE_BADGE_CONFIG[selectedRoleForMatrix].borderColor}`}>
              <Shield className={`w-5 h-5 shrink-0 mt-0.5 ${ROLE_BADGE_CONFIG[selectedRoleForMatrix].color}`} />
              <div className="text-xs">
                <p className={`font-bold ${ROLE_BADGE_CONFIG[selectedRoleForMatrix].color}`}>
                  {language === 'km' ? ROLE_BADGE_CONFIG[selectedRoleForMatrix].labelKm : ROLE_BADGE_CONFIG[selectedRoleForMatrix].labelEn} — {language === 'km' ? 'គោលការណ៍សិទ្ធិបច្ចុប្បន្ន' : 'Active Policy Specification'}
                </p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  {language === 'km' ? ROLE_BADGE_CONFIG[selectedRoleForMatrix].descriptionKm : ROLE_BADGE_CONFIG[selectedRoleForMatrix].descriptionEn}
                </p>
              </div>
            </div>

            {/* Quick Bulk Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500">
                {language === 'km' ? 'កំណត់រហ័សគ្រប់មុខងារ:' : 'Bulk Toggle Across All Features:'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkAction('all', true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  Enable All
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('all', false)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold hover:bg-red-100 cursor-pointer"
                >
                  Disable All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleBulkAction('view', true)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  All View
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('add', true)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  All Add
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('edit', true)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  All Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('delete', false)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Lock Delete
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-2/5">
                      {language === 'km' ? 'មុខងារ / ម៉ូឌុល (Feature Module)' : 'Feature Module'}
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      <div className="flex items-center justify-center gap-1 text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>View (មើល)</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      <div className="flex items-center justify-center gap-1 text-slate-700">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Add (បង្កើត)</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      <div className="flex items-center justify-center gap-1 text-slate-700">
                        <PenTool className="w-3.5 h-3.5 text-amber-600" />
                        <span>Edit (កែ)</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      <div className="flex items-center justify-center gap-1 text-slate-700">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete (លុប)</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right w-24">
                      <span>Row All</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {SYSTEM_FEATURES.map((feature) => {
                    const currentPerm = rolePermissions[selectedRoleForMatrix]?.[feature.id] || {
                      view: false,
                      add: false,
                      edit: false,
                      delete: false,
                    };
                    const isAllSelected = currentPerm.view && currentPerm.add && currentPerm.edit && currentPerm.delete;
                    const isProjectFeature = feature.id === 'project_invoice';

                    return (
                      <tr 
                        key={feature.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isProjectFeature ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Feature Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <div>
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{language === 'km' ? feature.labelKm : feature.labelEn}</span>
                                {isProjectFeature && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                    Project Quotation
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {language === 'km' ? feature.descriptionKm : feature.descriptionEn}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* VIEW CHECKBOX */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={currentPerm.view}
                              onChange={() => handleTogglePermission(feature.id, 'view')}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* ADD CHECKBOX */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={currentPerm.add}
                              onChange={() => handleTogglePermission(feature.id, 'add')}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* EDIT CHECKBOX */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={currentPerm.edit}
                              onChange={() => handleTogglePermission(feature.id, 'edit')}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* DELETE CHECKBOX */}
                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                              type="checkbox"
                              checked={currentPerm.delete}
                              onChange={() => handleTogglePermission(feature.id, 'delete')}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* ROW ALL TOGGLE */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleRowAll(feature.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              isAllSelected
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isAllSelected ? 'All On' : 'Toggle'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ROLE POLICY GUIDE                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DEVELOPER SPEC */}
          <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Developer Role Policy</h3>
                <span className="text-[11px] font-mono text-indigo-600 font-bold">Role: developer</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Default: Full Control All Features</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Developers have unrestricted View, Add, Edit, and Delete privileges across all agronomy, ERP, invoicing, settings, and user management modules.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 pl-1">
              <li>• Access to Project Quotation (A4) official generator</li>
              <li>• Access to GIS & Map engine API tokens</li>
              <li>• Full database synchronization and user access management</li>
            </ul>
          </div>

          {/* ADMIN SPEC */}
          <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Admin Role Policy</h3>
                <span className="text-[11px] font-mono text-blue-600 font-bold">Role: admin</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Default: Full Control (Exception Project Quotation A4)</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Admins manage daily farm operations, inventory, finances, customers, and team accounts. Project Quotation (A4) is restricted by default.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 pl-1">
              <li>• Full Add, Edit, Delete control for all Agronomy & ERP</li>
              <li>• Excluded from Project Quotation (A4) proposal creation</li>
              <li>• Can manage farmer & team account registrations</li>
            </ul>
          </div>

          {/* FARMERS SPEC */}
          <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Farmers Role Policy</h3>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">Role: farmer</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Default: (View, Add, Edit) All Features Exception Project</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Farmers can view, record, and update daily farm cycles, logs, scouting, tasks, and harvest data. Delete operations and Project Quotation (A4) are protected.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 pl-1">
              <li>• Can create and edit farm tasks, harvests, and scouting logs</li>
              <li>• Cannot delete records or modify system-critical architecture</li>
              <li>• Excluded from Project Quotation (A4)</li>
            </ul>
          </div>

          {/* TEAM SPEC */}
          <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Team Role Policy</h3>
                <span className="text-[11px] font-mono text-amber-600 font-bold">Role: team</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Default: (View, Add, Edit) All Features Exception Project</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Field staff and operations team record irrigation events, stock intake, deliveries, and plant maintenance. Delete operations and Project Quotation are restricted.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 pl-1">
              <li>• View, Add, Edit operations enabled for operational tasks</li>
              <li>• Zero delete permissions to safeguard audit compliance</li>
              <li>• Excluded from Project Quotation (A4)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT USER                                                    */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#164e22] text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingUser 
                      ? (language === 'km' ? 'កែសម្រួលគណនីអ្នកប្រើប្រាស់' : 'Edit User Account')
                      : (language === 'km' ? 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី' : 'Add New User Account')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' ? 'កំណត់ព័ត៌មាន និងតួនាទីសិទ្ធិ' : 'Define credentials, role and permissions'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name (EN) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះពេញ (English) *' : 'Full Name (English) *'}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sokha Chea"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>

                {/* Full Name (KM) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Full Name (Khmer)'}
                  </label>
                  <input
                    type="text"
                    value={formNameKm}
                    onChange={(e) => setFormNameKm(e.target.value)}
                    placeholder="ឧ. ជា សុខា"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-khmer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះគណនី (Username) *' : 'Username *'}
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. sokha_admin"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'អ៊ីមែល' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sokha@melonpro.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'តួនាទី (Role) *' : 'Role & Permission Tier *'}
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-bold"
                  >
                    <option value="developer">Developer (Full Control All)</option>
                    <option value="admin">Admin (All Except Quotation A4)</option>
                    <option value="farmer">Farmers (View, Add, Edit - No Project)</option>
                    <option value="team">Team (View, Add, Edit - No Project)</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'លេខសម្ងាត់ (Password) *' : 'Password *'}
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ផ្នែក / ជំនាញ' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Greenhouse Agronomy"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ស្ថានភាព' : 'Account Status'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white font-bold"
                  >
                    <option value="active">Active (សកម្ម)</option>
                    <option value="inactive">Inactive (អសកម្ម)</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingUser ? (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Update User') : (language === 'km' ? 'បង្កើតគណនី' : 'Create User')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
