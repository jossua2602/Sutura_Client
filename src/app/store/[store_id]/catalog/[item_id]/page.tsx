'use client';

import React, { use } from 'react';
import { Loader2 } from 'lucide-react';
import { useCatalogItemDetail } from '@/components/store-catalog-detail/hooks/useCatalogItemDetail';
import CatalogDetailHeader from '@/components/store-catalog-detail/CatalogDetailHeader';
import CatalogDesktopHeader from '@/components/store-catalog-detail/CatalogDesktopHeader';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import Link from 'next/link';
import CatalogBottomActionBar from '@/components/store-catalog-detail/CatalogBottomActionBar';
import CatalogDesktopActionButtons from '@/components/store-catalog-detail/CatalogDesktopActionButtons';
import CatalogFindInStoreSheet from '@/components/store-catalog-detail/CatalogFindInStoreSheet';
import { isStoreOpen } from '@/lib/storeStatus';
import BulkOrderSheet from '@/components/store-catalog-detail/BulkOrderSheet';
import CatalogDetailBreadcrumb from '@/components/store-catalog-detail/CatalogDetailBreadcrumb';

export default function PublicProductDetailPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const {
    item,
    loading,
    selectedImage,
    setSelectedImage,
    selectedVariation,
    setSelectedVariation,
    isBulkItem,
    bulkMinQty,
    bulkRosterFields,
    showBulkSheet,
    setShowBulkSheet,
    openBulkSheet,
    bulkOrganizationName,
    setBulkOrganizationName,
    bulkRoster,
    setBulkRoster,
    bulkBranchId,
    setBulkBranchId,
    bulkSubmitting,
    bulkError,
    handleBulkOrder,
    headerOpacity,
    showFind,
    setShowFind,
    findInteractive,
    findSheetBranchId,
    setFindSheetBranchId,
    showBookConfirm,
    setShowBookConfirm,
    showBranchPickModal,
    setShowBranchPickModal,
    userPos,
    locating,
    locateError,
    handleLocate,
    pageRef,
    gate,
    handleBackClick,
    handleReportClick,
    branches,
    findBranch,
    mapBranches,
    selectedFindBranch,
    selectedDistanceKm,
    nearerBranchSuggestion,
    buildBookHref,
  } = useCatalogItemDetail(storeId, itemId);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-full flex items-center justify-center bg-canvas">
        <div className="text-center text-ink-faint">Item not found.</div>
      </div>
    );
  }

  const bookHref = gate(buildBookHref(selectedFindBranch?.slug ?? findBranch?.slug ?? null));
  const bookConfirmHref = buildBookHref(branches.find(b => b.id === selectedFindBranch?.id)?.slug);

  return (
    <div ref={pageRef} className="min-h-full flex flex-col bg-canvas">
      {/* Header — desktop minimal / mobile floating overlay */}
      <div className="hidden min-[600px]:block">
        <CatalogDesktopHeader onBack={handleBackClick} onReport={handleReportClick} />
      </div>
      <div className="min-[600px]:hidden">
        <CatalogDetailHeader
          headerOpacity={headerOpacity}
          onBack={handleBackClick}
          onReport={handleReportClick}
        />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10">
        {/* Breadcrumb — tablet/desktop only */}
        <div className="hidden min-[600px]:block">
          <CatalogDetailBreadcrumb item={item} />
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 1: Hero Gallery (left) + Buy Zone (right)
            Two-column activates at 600px.
        ────────────────────────────────────────────────────── */}
        <CatalogDetailGrid
          gallery={
            <CatalogHeroGallery
              item={item}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              selectedVariation={selectedVariation}
              setSelectedVariation={setSelectedVariation}
              storeId={storeId}
              itemId={itemId}
              colorOptions={[]}
              disableZoom={false}
              hideActions
            />
          }
          buyZone={
          <div className="px-4 min-[375px]:px-6 min-[600px]:px-0 pt-4 min-[600px]:pt-0 space-y-3">
            {/* Photos and description only: no price, ratings, colors, sizes or specs. */}
            <h1 className="text-2xl min-[600px]:text-[28px] font-bold text-ink leading-tight">{item.name}</h1>
            {item.store && (
              <Link href={gate(`/store/${item.store.slug}`)} className="inline-block text-sm font-semibold text-taupe hover:underline">
                {item.store.name}
              </Link>
            )}
            {item.description?.trim() ? (
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-line">{item.description}</p>
            ) : (
              <p className="text-sm text-ink-faint">No description yet.</p>
            )}

            {/* Find a Branch | Book an Appointment (desktop/tablet inline buttons) */}
            <CatalogDesktopActionButtons
              onOpenFind={() => setShowFind(true)}
              bookHref={bookHref}
              orderAction={isBulkItem ? 'bulk' : null}
              onOrder={isBulkItem ? openBulkSheet : undefined}
            />
          </div>
          }
        />

      </main>

      {/* Mobile sticky bottom action bar */}
      <CatalogBottomActionBar
        onOpenFind={() => setShowFind(true)}
        bookHref={bookHref}
        storeSlug={item.store?.slug}
        orderAction={isBulkItem ? 'bulk' : null}
        onOrder={isBulkItem ? openBulkSheet : undefined}
      />

      <BulkOrderSheet
        show={showBulkSheet}
        onClose={() => setShowBulkSheet(false)}
        itemName={item.name}
        sizes={item.sizes}
        minQty={bulkMinQty}
        rosterFields={bulkRosterFields}
        branches={branches}
        branchId={bulkBranchId}
        setBranchId={setBulkBranchId}
        organizationName={bulkOrganizationName}
        setOrganizationName={setBulkOrganizationName}
        roster={bulkRoster}
        setRoster={setBulkRoster}
        submitting={bulkSubmitting}
        error={bulkError}
        onSubmit={handleBulkOrder}
      />

      <CatalogFindInStoreSheet
        showFind={showFind}
        onClose={() => setShowFind(false)}
        findInteractive={findInteractive}
        mapBranches={mapBranches}
        findSheetBranchId={findSheetBranchId}
        setFindSheetBranchId={setFindSheetBranchId}
        selectedFindBranch={selectedFindBranch}
        userPos={userPos}
        onLocate={handleLocate}
        locating={locating}
        locateError={locateError}
        selectedImage={selectedImage}
        itemName={item.name}
        itemPrice={item.price}
        storeName={item.store?.name ?? ''}
        storeLogoPath={item.store?.logo_path ?? null}
        storeIsOpen={isStoreOpen(item.store?.operating_hours)}
        showBookConfirm={showBookConfirm}
        setShowBookConfirm={setShowBookConfirm}
        selectedDistanceKm={selectedDistanceKm}
        nearerBranchSuggestion={nearerBranchSuggestion}
        showBranchPickModal={showBranchPickModal}
        setShowBranchPickModal={setShowBranchPickModal}
        bookConfirmHref={bookConfirmHref}
      />
    </div>
  );
}
