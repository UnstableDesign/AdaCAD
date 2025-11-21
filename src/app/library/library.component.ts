import { AfterViewInit, Component, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatError, MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { hexToRgb, Material } from 'adacad-drafting-lib';
import { Draft } from 'adacad-drafting-lib/draft';
import { createMaterial, setMaterialID } from 'adacad-drafting-lib/material';
import { Subscription } from 'rxjs';
import { DraftNode, DraftStateNameChange, FileMetaStateChange, MaterialsStateChange, MediaInstance } from '../core/model/datatypes';
import { saveAsBmp } from '../core/model/helper';
import { FileService } from '../core/provider/file.service';
import { MaterialsService } from '../core/provider/materials.service';
import { MediaService } from '../core/provider/media.service';
import { OperationService } from '../core/provider/operation.service';
import { StateService } from '../core/provider/state.service';
import { TreeService } from '../core/provider/tree.service';
import { WorkspaceService } from '../core/provider/workspace.service';
import { DraftRenderingComponent } from '../core/ui/draft-rendering/draft-rendering.component';
import { MaterialComponent } from '../core/ui/material/material';
@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
  imports: [MatButton, MaterialComponent, ReactiveFormsModule, DraftRenderingComponent, FormsModule, MatFormField, MatLabel, MatError, MatInput, MatTooltip, MatChipsModule],
  standalone: true
})
export class LibraryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hiddenCanvas', { static: false }) hiddenCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('csvFileInput', { static: false }) csvFileInput: ElementRef<HTMLInputElement>;
  @ViewChildren(DraftRenderingComponent) draftRenderings: QueryList<DraftRenderingComponent>;

  @Output() onWorkspaceRename = new EventEmitter<string>();

  private tree = inject(TreeService);
  private ms = inject(MaterialsService);
  private ws = inject(WorkspaceService);
  private fs = inject(FileService);
  private ss = inject(StateService);
  private ops = inject(OperationService);
  private mediaService = inject(MediaService);

  @ViewChild('materials', { static: false }) materials: MaterialComponent;

  drafts: Array<{ id: number; name: string; draft: Draft }> = [];
  media: Array<MediaInstance> = [];
  selectedDraftIds: Set<number> = new Set();
  private draftRenderingsSubscription: Subscription;


  filename: FormControl;
  fileDescription: FormControl;
  id: number;
  from_share: string;
  time: number;
  owner: string;

  fileMetaChangeUndoSubscription: Subscription;

  ngOnInit() {
    // Initialize form control with current filename
    const currentFileName = this.ws.getCurrentFile()?.name || '';
    this.filename = new FormControl(currentFileName, [Validators.required, Validators.minLength(1)]);

    const currentFileDescription = this.ws.getCurrentFile()?.desc || '';
    this.fileDescription = new FormControl('');


    const meta = this.ws.getCurrentFile();
    this.loadMeta();
    this.loadDrafts();
    this.loadMaterials();
    this.loadMedia();

    // this.filename.valueChanges.subscribe(value => {
    //   if (this.filename.valid && this.filename.dirty) {
    //     this.renameWorkspace(value);
    //   }
    // });


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

    if (this.fileMetaChangeUndoSubscription) {
      this.fileMetaChangeUndoSubscription.unsubscribe();
    }
    if (this.draftRenderingsSubscription) {
      this.draftRenderingsSubscription.unsubscribe();
    }
  }


  //called from library when the workspace name is changed in the library. 
  renameWorkspace(name: string) {
    this.filename.markAsPristine();


    const beforeMeta = {
      id: this.ws.getCurrentFile().id,
      name: this.ws.getCurrentFile().name,
      desc: this.ws.getCurrentFile().desc,
      from_share: this.ws.getCurrentFile().from_share,
      time: this.ws.getCurrentFile().time,
    };

    this.ws.setCurrentFileName(name);
    const afterMeta = this.ws.getCurrentFile();

    this.ss.addStateChange(<FileMetaStateChange>{
      type: 'META_CHANGE',
      id: this.ws.getCurrentFile().id,
      before: beforeMeta,
      after: afterMeta
    });
    this.ws.setCurrentFileName(name);
    this.onWorkspaceRename.emit(name);
  }

  //called from app when the workspace name is changed in the footer. 
  updateWorkspaceName(name: string) {
    this.filename.setValue(name, { emitEvent: false });
    this.filename.markAsPristine();
  }

  //description changes can only originate from this location 
  updateWorkspaceDescription(description: string) {
    this.fileDescription.markAsPristine();

    const beforeMeta = {
      id: this.ws.getCurrentFile().id,
      name: this.ws.getCurrentFile().name,
      desc: this.ws.getCurrentFile().desc,
      from_share: this.ws.getCurrentFile().from_share,
      time: this.ws.getCurrentFile().time,
    };

    this.ws.setCurrentFileDesc(description);
    const afterMeta = this.ws.getCurrentFile();


    this.ss.addStateChange(<FileMetaStateChange>{
      originator: 'FILEMETA',
      type: 'META_CHANGE',
      id: this.ws.getCurrentFile().id,
      before: beforeMeta,
      after: afterMeta
    });
  }

  updateWorkspaceDescriptionFromUndo(description: string) {
    this.fileDescription.setValue(description, { emitEvent: false });
    this.fileDescription.markAsPristine();
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

  loadMeta() {
    const meta = this.ws.getCurrentFile();
    this.id = meta.id;
    this.from_share = meta.from_share;
    this.time = meta?.time || -1;
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
    return 0;
    // if (this.isSeedDraft(draftId)) {
    //   return 0;
    // }
    // return this.tree.getUpstreamOperations(draftId).length;
  }

  loadMaterials() {
    console.log("LIBRARY LOAD MATERIALS", this.materials);
    if (this.materials !== undefined && this.materials !== null) {
      this.materials.onLoad();
    }
  }

  loadMedia() {
    this.media = this.mediaService.current.slice(); // Create a copy of the array
  }

  onFocus(id: number) {
    this.drafts = [];
    this.media = [];
    this.selectedDraftIds.clear();
    this.loadDrafts();
    this.loadMaterials();
    this.loadMedia();
    this.loadMeta();
    this.filename.setValue(this.ws.getCurrentFile().name, { emitEvent: false });
    this.fileDescription.setValue(this.ws.getCurrentFile().desc || '', { emitEvent: false });

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

    // const upstreamOpIds = this.tree.getUpstreamOperations(draftId);
    const upstreamOpIds = [];
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

  /**
   * Exports the current materials list as a CSV file
   */
  exportMaterialsAsCSV() {
    const materials = this.ms.getShuttles();

    // CSV header
    const headers = ['id', 'name', 'color', 'diameter', 'notes'];

    // Escape CSV values (handle commas, quotes, and newlines)
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvRows = [headers.join(',')];

    materials.forEach(material => {
      const row = [
        escapeCSV(material.id),
        escapeCSV(material.name),
        escapeCSV(material.color),
        escapeCSV(material.diameter),
        escapeCSV(material.notes || '')
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `materials_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Handles CSV file upload and updates materials
   */
  onCSVFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const csvContent = e.target.result as string;
        this.importMaterialsFromCSV(csvContent);
      } catch (error) {
        console.error('Error reading CSV file:', error);
        alert('Error reading CSV file. Please check the file format.');
      }

      // Reset the input so the same file can be selected again
      if (this.csvFileInput) {
        this.csvFileInput.nativeElement.value = '';
      }
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      if (this.csvFileInput) {
        this.csvFileInput.nativeElement.value = '';
      }
    };

    reader.readAsText(file);
  }

  /**
   * Parses CSV content and updates materials
   */
  private importMaterialsFromCSV(csvContent: string) {
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      alert('CSV file must contain at least a header row and one data row.');
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);

    // Expected headers
    const expectedHeaders = ['id', 'name', 'color', 'diameter', 'notes'];
    const headerMap: { [key: string]: number } = {};

    // Validate all required headers are present
    for (const header of expectedHeaders) {
      const index = headers.findIndex(h => h.toLowerCase().trim() === header.toLowerCase());
      if (index === -1) {
        alert(`CSV file is missing required column: ${header}`);
        return;
      }
      headerMap[header] = index;
    }

    // Parse data rows
    const importedMaterials: Material[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length < expectedHeaders.length) {
        console.warn(`Skipping row ${i + 1}: insufficient columns`);
        continue;
      }

      try {
        const id = parseInt(values[headerMap['id']], 10);
        const name = values[headerMap['name']] || '';
        const color = values[headerMap['color']] || '#000000';
        const diameter = parseFloat(values[headerMap['diameter']]) || 1;
        const notes = values[headerMap['notes']] || '';

        // Validate color format
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
          console.warn(`Row ${i + 1}: Invalid color format "${color}", using default`);
          continue;
        }

        const material = createMaterial({
          id: id,
          name: name,
          color: color,
          diameter: diameter,
          notes: notes,
          insert: true,
          visible: true,
          thickness: 100,
          type: 0
        });

        material.rgb = hexToRgb(color);
        importedMaterials.push(material);
      } catch (error) {
        console.error(`Error parsing row ${i + 1}:`, error);
      }
    }

    if (importedMaterials.length === 0) {
      alert('No valid materials found in CSV file.');
      return;
    }

    // Confirm before updating
    const confirmMessage = `This will replace ${this.ms.getShuttles().length} existing materials with ${importedMaterials.length} materials from the CSV file. Continue?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    // Store before state for undo
    const beforeMaterials = this.ms.getShuttles().slice();

    // Update materials - reassign IDs to match array indices
    importedMaterials.forEach((material, index) => {
      setMaterialID(material, index);
    });

    // Replace materials

    console.log("IMPORTED MATERIALS", importedMaterials);

    // Add state change for undo/redo
    const change: MaterialsStateChange = {
      originator: 'MATERIALS',
      type: 'UPDATED',
      before: beforeMaterials,
      after: this.ms.getShuttles().slice()
    };
    this.ss.addStateChange(change);


    this.ms.overloadShuttles(importedMaterials);

    console.log("After Overload", this.ms.getShuttles());
    // Reload materials in the view
    this.loadMaterials();

    alert(`Successfully imported ${importedMaterials.length} materials.`);
  }

  /**
   * Parses a CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    values.push(current.trim());

    return values;
  }

  /**
   * Triggers the CSV file input click
   */
  triggerCSVImport() {
    if (this.csvFileInput) {
      this.csvFileInput.nativeElement.click();
    }
  }
}

