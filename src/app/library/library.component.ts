import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { Material } from 'adacad-drafting-lib';
import { Draft } from 'adacad-drafting-lib/draft';
import { Subscription } from 'rxjs';
import { DraftNode, DraftStateNameChange } from '../core/model/datatypes';
import { saveAsBmp } from '../core/model/helper';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
  imports: [MatButton, DraftRenderingComponent, FormsModule, MatFormField, MatLabel, MatInput, MatTooltip],
  standalone: true
})
export class LibraryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hiddenCanvas', { static: false }) hiddenCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChildren(DraftRenderingComponent) draftRenderings: QueryList<DraftRenderingComponent>;

  private tree = inject(TreeService);
  private ms = inject(MaterialsService);
  private ws = inject(WorkspaceService);
  private fs = inject(FileService);
  private ss = inject(StateService);
  private ops = inject(OperationService);

  drafts: Array<{ id: number; name: string; draft: Draft }> = [];
  materials: Array<Material> = [];
  selectedDraftIds: Set<number> = new Set();
  private draftRenderingsSubscription: Subscription;

  ngOnInit() {



    this.loadDrafts();
    this.loadMaterials();
  }

  ngAfterViewInit() {
    // Trigger rendering after view is initialized
    this.renderAllDrafts();

    // Subscribe to QueryList changes to handle dynamic updates
    this.draftRenderingsSubscription = this.draftRenderings.changes.subscribe(() => {
      this.renderAllDrafts();
    });
  }

  ngOnDestroy() {
    if (this.draftRenderingsSubscription) {
      this.draftRenderingsSubscription.unsubscribe();
    }
  }

  private renderAllDrafts() {
    // Use setTimeout to ensure the view has fully updated
    setTimeout(() => {
      this.draftRenderings.forEach((rendering) => {
        if (rendering.id !== -1) {
          rendering.onNewDraftLoaded(rendering.id);
          rendering.redrawAll();
        }
      });
    }, 0);
  }

  loadDrafts() {
    const draftNodes: Array<DraftNode> = this.tree.getDraftNodes();
    console.log("LIBRARY LOAD DRAFTS", draftNodes);
    this.drafts = draftNodes
      .filter(node => node.draft !== null && node.draft !== undefined)
      .map(node => ({
        id: node.id,
        name: this.tree.getDraftName(node.id),
        draft: node.draft
      }))
      .sort((a, b) => {
        // Get the number of operations for each draft
        const aOpCount = this.getDraftOperationCount(a.id);
        const bOpCount = this.getDraftOperationCount(b.id);

        // Sort by operation count (ascending)
        return aOpCount - bOpCount;
      });
  }

  getDraftOperationCount(draftId: number): number {
    if (this.isSeedDraft(draftId)) {
      return 0;
    }
    return this.tree.getUpstreamOperations(draftId).length;
  }

  loadMaterials() {
    this.materials = this.ms.getShuttles();
  }

  onFocus(id: number) {
    this.drafts = [];
    this.materials = [];
    this.selectedDraftIds.clear();
    this.loadDrafts();
    this.loadMaterials();

    // Trigger rendering after view updates
    this.renderAllDrafts();
  }

  toggleDraftSelection(draftId: number) {
    if (this.selectedDraftIds.has(draftId)) {
      this.selectedDraftIds.delete(draftId);
    } else {
      this.selectedDraftIds.add(draftId);
    }
  }

  isDraftSelected(draftId: number): boolean {
    return this.selectedDraftIds.has(draftId);
  }

  getSelectedDraftsCount(): number {
    return this.selectedDraftIds.size;
  }

  isSeedDraft(draftId: number): boolean {
    return this.tree.isSeedDraft(draftId);
  }

  getDraftOperations(draftId: number): Array<{ displayName: string; opName: string; color: string }> {
    if (this.isSeedDraft(draftId)) {
      return [];
    }

    const upstreamOpIds = this.tree.getUpstreamOperations(draftId);
    const operations: Array<{ displayName: string; opName: string; color: string }> = [];

    upstreamOpIds.forEach(opId => {
      const opNode = this.tree.getOpNode(opId);
      if (opNode) {
        const displayName = this.ops.getDisplayName(opNode.name);
        let displayNames: Array<string> = [];

        if (typeof displayName === 'string') {
          displayNames = [displayName];
        } else if (Array.isArray(displayName)) {
          displayNames = displayName.filter(name => typeof name === 'string');
        }

        // Get the category color for this operation
        const categories = this.ops.getOpCategories(opNode.name);
        const color = categories.length > 0 ? categories[0].color : '#e3f2fd';

        displayNames.forEach(name => {
          operations.push({
            displayName: name,
            opName: opNode.name,
            color: color
          });
        });
      }
    });

    // Reverse the order so operations appear left to right in creation order
    return operations.reverse();
  }

  getDraftUsedBy(draftId: number): Array<{ displayName: string; opName: string; color: string; inletLabel?: string }> {
    // Get all operations that directly use this draft as input
    const allOpNodes = this.tree.getOpNodes();
    const operations: Array<{ displayName: string; opName: string; color: string; inletLabel?: string }> = [];

    allOpNodes.forEach(opNode => {
      // Find which inlet this draft is connected to
      const inputsWithNdx = this.tree.getInputsWithNdx(opNode.id);
      let inletId = -1;

      for (const input of inputsWithNdx) {
        // Check if this input connection leads to our draft
        // The input.tn.node.id is a connection node, so we need to get the draft from it
        if (input.tn.node.type === 'cxn') {
          const connectionInput = this.tree.getConnectionInput(input.tn.node.id);
          if (connectionInput === draftId) {
            inletId = input.ndx;
            break;
          }
        }
      }

      if (inletId === -1) return; // Draft not found as input to this operation

      const op = this.ops.getOp(opNode.name);
      if (!op) return;

      // Check if this inlet has a dynamic value (color, string, notation, profile)
      let inletLabel: string | undefined = undefined;
      if (inletId < op.inlets.length) {
        const inlet = op.inlets[inletId];
        const dynamicInletTypes = ['color', 'string', 'notation', 'profile'];

        if (dynamicInletTypes.includes(inlet.type)) {
          // Get the inlet value from the opNode
          if (opNode.inlets && opNode.inlets[inletId] !== undefined) {
            const inletValue = opNode.inlets[inletId];
            // Use the inlet name if available, otherwise use the value
            inletLabel = inlet.name || String(inletValue);
          } else if (inlet.name) {
            inletLabel = inlet.name;
          }
        }
      }

      const displayName = this.ops.getDisplayName(opNode.name);
      let displayNames: Array<string> = [];

      if (typeof displayName === 'string') {
        displayNames = [displayName];
      } else if (Array.isArray(displayName)) {
        displayNames = displayName.filter(name => typeof name === 'string');
      }

      // Get the category color for this operation
      const categories = this.ops.getOpCategories(opNode.name);
      const color = categories.length > 0 ? categories[0].color : '#e3f2fd';

      displayNames.forEach(name => {
        operations.push({
          displayName: name,
          opName: opNode.name,
          color: color,
          inletLabel: inletLabel
        });
      });
    });

    return operations;
  }

  onDraftNameChange(draftId: number, newName: string) {
    const draft = this.tree.getDraft(draftId);
    if (!draft) return;

    const beforeName = this.tree.getDraftName(draftId);
    draft.ud_name = newName;

    // Update the draft in the tree
    this.tree.setDraftOnly(draftId, draft);

    // Add state change for undo/redo
    this.ss.addStateChange(<DraftStateNameChange>{
      originator: 'DRAFT',
      type: 'NAME_CHANGE',
      id: draftId,
      before: beforeName,
      after: newName
    });

    // Update the local drafts array
    const draftIndex = this.drafts.findIndex(d => d.id === draftId);
    if (draftIndex !== -1) {
      this.drafts[draftIndex].name = this.tree.getDraftName(draftId);
    }
  }

  async downloadAllDraftsAsBitmaps() {
    if (!this.hiddenCanvas) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = this.hiddenCanvas.nativeElement;

    // Get drafts to download - either selected ones or all if none selected
    const draftsToDownload = this.selectedDraftIds.size > 0
      ? this.drafts.filter(d => this.selectedDraftIds.has(d.id))
      : this.drafts;

    // Download each draft sequentially to avoid browser blocking multiple downloads
    for (const draftInfo of draftsToDownload) {
      try {
        await saveAsBmp(
          canvas,
          draftInfo.draft,
          this.ws.selected_origin_option,
          this.ms,
          this.fs
        );
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error downloading draft ${draftInfo.name}:`, error);
      }
    }
  }
}

