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
import { ModelServerSubscriptionService } from '@modelserver/theia/lib/browser';
import {
  ModelServerClient,
  ModelServerCommand,
  ModelServerCommandUtil,
  ModelServerReferenceDescription,
} from '@modelserver/theia/lib/common';
import { ILogger } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { inject, injectable } from 'inversify';
import {
  JsonFormsTreeEditorWidget,
  JsonFormsTreeEditorWidgetOptions,
} from 'jsonforms-tree-extension/lib/browser/editor/json-forms-tree-editor-widget';
import { JSONFormsWidget } from 'jsonforms-tree-extension/lib/browser/editor/json-forms-widget';
import { JsonFormsTree } from 'jsonforms-tree-extension/lib/browser/tree/json-forms-tree';
import { AddCommandProperty, JsonFormsTreeWidget } from 'jsonforms-tree-extension/lib/browser/tree/json-forms-tree-widget';
import { clone, isEqual } from 'lodash';

import { CoffeeModel } from './coffee-model';

@injectable()
export class CoffeeTreeEditorWidget extends JsonFormsTreeEditorWidget {
  constructor(
    @inject(JsonFormsTreeEditorWidgetOptions)
    readonly options: JsonFormsTreeEditorWidgetOptions,
    @inject(JsonFormsTreeWidget)
    readonly treeWidget: JsonFormsTreeWidget,
    @inject(JSONFormsWidget)
    readonly formWidget: JSONFormsWidget,
    @inject(WorkspaceService)
    readonly workspaceService: WorkspaceService,
    @inject(ILogger) readonly logger: ILogger,
    @inject(ModelServerClient)
    private readonly modelServerApi: ModelServerClient,
    @inject(ModelServerSubscriptionService)
    private readonly subscriptionService: ModelServerSubscriptionService
  ) {
    super(
      options,
      treeWidget,
      formWidget,
      workspaceService,
      logger,
      CoffeeTreeEditorWidget.WIDGET_ID
    );
    this.subscriptionService.onDirtyStateListener(dirtyState => {
      this.dirty = dirtyState;
      this.onDirtyChangedEmitter.fire();
    });
    this.subscriptionService.onFullUpdateListener(fullUpdate => {
      this.instanceData = fullUpdate;

      this.treeWidget
        .setData({ error: false, data: this.instanceData })
        .then(() => this.treeWidget.select(this.getOldSelectedPath()));
    });
    this.subscriptionService.onIncrementalUpdateListener(incrementalUpdate => {
      const command = incrementalUpdate as ModelServerCommand;
      // the #/ marks the beginning of the actual path, but we also want the first slash removed so +3
      const ownerPropIndexPath = command.owner.$ref
        .substring(command.owner.$ref.indexOf('#/') + 3)
        .split('/')
        .filter(v => v.length !== 0)
        .map(path => {
          const indexSplitPos = path.indexOf('.');
          // each property starts with an @ so we ignore it
          return {
            property: path.substring(1, indexSplitPos),
            index: path.substring(indexSplitPos + 1)
          };
        });
      const ownerNode = this.treeWidget.findNode(ownerPropIndexPath);
      const objectToModify = ownerPropIndexPath.reduce(
        (data, path) =>
          path.index === undefined
            ? data[path.property]
            : data[path.property][path.index],
        this.instanceData
      );
      switch (command.type) {
        case 'add': {
          if (!objectToModify[command.feature]) {
            objectToModify[command.feature] = [];
          }
          objectToModify[command.feature].push(...command.objectsToAdd);
          this.treeWidget.addChildren(
            ownerNode,
            command.objectsToAdd,
            command.feature
          );
          break;
        }
        case 'remove': {
          command.indices.forEach(i =>
            objectToModify[command.feature].splice(i, 1)
          );
          this.treeWidget.removeChildren(
            ownerNode,
            command.indices,
            command.feature
          );
          break;
        }
        case 'set': {
          // maybe we can directly manipulate the data?
          const data = clone(ownerNode.jsonforms.data);
          // FIXME handle array changes
          if (command.dataValues) {
            data[command.feature] = command.dataValues[0];
            objectToModify[command.feature] = command.dataValues[0];
          } else {
            data[command.feature] = command.objectsToAdd[0];
            objectToModify[command.feature] = command.objectsToAdd[0];
          }
          this.treeWidget.updateDataForNode(ownerNode, data);
        }
        default: {
        }
      }
    });
    this.modelServerApi.get(this.getModelIDToRequest()).then(response => {
      if (response.statusCode === 200) {
        if (isEqual(this.instanceData, response.body)) {
          return;
        }
        this.instanceData = response.body;
        this.treeWidget
          .setData({ error: false, data: this.instanceData })
          .then(() => this.treeWidget.selectFirst());
        return;
      }
      this.treeWidget.setData({ error: response.statusMessage });
      this.renderError(
        "An error occurred when requesting '" +
          this.getModelIDToRequest() +
          "' - Status " +
          response.statusCode +
          ' ' +
          response.statusMessage
      );
      this.instanceData = undefined;
      return;
    });
    this.modelServerApi.subscribe(this.getModelIDToRequest());
  }
  private getOldSelectedPath(): string[] {
    const paths: string[] = [];
    if (!this.selectedNode) {
      return paths;
    }
    paths.push(this.selectedNode.name);
    let parent = this.selectedNode.parent;
    while (parent) {
      paths.push(parent.name);
      parent = parent.parent;
    }
    paths.splice(paths.length - 1, 1);
    return paths;
  }
  public uri(): URI {
    return this.options.uri;
  }

  public save(): void {
    this.logger.info('Save data to server');
    this.modelServerApi.save(this.getModelIDToRequest());
  }

  private getEClassFromKey(key: string): string {
    return CoffeeModel.Type[key[0].toUpperCase() + key.slice(1)];
  }

  protected deleteNode(node: Readonly<JsonFormsTree.Node>): void {
    const removeCommand = ModelServerCommandUtil.createRemoveCommand(
      this.getNodeDescription(node.parent as JsonFormsTree.Node),
      node.jsonforms.property,
      node.jsonforms.index ? [Number(node.jsonforms.index)] : []
    );
    this.modelServerApi.edit(this.getModelIDToRequest(), removeCommand);
  }
  protected addNode({ node, eClass, property }: AddCommandProperty): void {
    const addCommand = ModelServerCommandUtil.createAddCommand(
      this.getNodeDescription(node),
      property,
      [{ eClass }]
    );
    this.modelServerApi.edit(this.getModelIDToRequest(), addCommand);
  }

  dispose() {
    this.modelServerApi.unsubscribe(this.getModelIDToRequest());
    super.dispose();
  }

  protected handleFormUpdate(data: any, node: ModelServerReferenceDescription) {
    Object.keys(data)
      .filter(key => key !== 'eClass')
      .forEach(key => {
        if (
          data[key] instanceof Object &&
          !isEqual(this.selectedNode.jsonforms.data[key], data[key])
        ) {
          const eClass = data[key].eClass || this.getEClassFromKey(key);
          const setCommand = ModelServerCommandUtil.createSetCommand(
            node,
            key,
            []
          );
          const toAdd = clone(data[key]);
          toAdd['eClass'] = eClass;
          setCommand.objectsToAdd = [toAdd];
          const ref = { eClass, $ref: '//@objectsToAdd.0' };
          setCommand.objectValues = [ref];
          this.modelServerApi.edit(this.getModelIDToRequest(), setCommand);
        } else {
          const setCommand = ModelServerCommandUtil.createSetCommand(
            node,
            key,
            [data[key]]
          );
          this.modelServerApi.edit(this.getModelIDToRequest(), setCommand);
        }
      });
  }
}
export namespace CoffeeTreeEditorWidget {
  export const WIDGET_ID = 'json-forms-tree-editor';
}
