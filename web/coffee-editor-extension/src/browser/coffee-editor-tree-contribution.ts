/*!
 * Copyright (C) 2019 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 */
import { CommandRegistry, MenuModelRegistry } from '@theia/core';
import { ApplicationShell, OpenerService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from 'inversify';
import { JsonFormsTreeEditorWidget } from 'jsonforms-tree-extension/lib/browser/editor/json-forms-tree-editor-widget';
import { JsonFormsTreeEditorContribution } from 'jsonforms-tree-extension/lib/browser/json-forms-tree-contribution';
import { ModelService } from 'jsonforms-tree-extension/lib/browser/model-service';
import { JsonFormsTree } from 'jsonforms-tree-extension/lib/browser/tree/json-forms-tree';
import { JsonFormsTreeContextMenu } from 'jsonforms-tree-extension/lib/browser/tree/json-forms-tree-widget';

import { CoffeeTreeCommands, OpenWorkflowDiagramCommandHandler } from './coffee-tree/coffee-tree-container';
import { CoffeeTreeEditorWidget } from './coffee-tree/coffee-tree-editor-widget';

@injectable()
export class CoffeeTreeEditorContribution extends JsonFormsTreeEditorContribution {
  @inject(ApplicationShell) protected shell: ApplicationShell;
  @inject(OpenerService) protected opener: OpenerService;

  constructor(
    @inject(JsonFormsTree.LabelProvider) labelProvider: JsonFormsTree.LabelProvider,
    @inject(ModelService) modelService: ModelService
  ) {
    super(modelService, labelProvider);
  }

  readonly id = CoffeeTreeEditorWidget.WIDGET_ID;
  readonly label = JsonFormsTreeEditorWidget.WIDGET_LABEL;

  canHandle(uri: URI): number {
    if (
      uri.path.ext === '.coffee'
    ) {
      return 1000;
    }
    return 0;
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(
      CoffeeTreeCommands.OPEN_WORKFLOW_DIAGRAM,
      new OpenWorkflowDiagramCommandHandler(this.shell, this.opener));

    super.registerCommands(commands);
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(JsonFormsTreeContextMenu.CONTEXT_MENU, {
      commandId: CoffeeTreeCommands.OPEN_WORKFLOW_DIAGRAM.id,
      label: CoffeeTreeCommands.OPEN_WORKFLOW_DIAGRAM.label
    });

    super.registerMenus(menus);
  }

}
